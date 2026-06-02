package storage

import (
	"encoding/binary"
	"io"
	"os"
)

// mp4Duration returns the duration in seconds by parsing the moov/mvhd box.
// Returns 0 if the file is not a recognised MP4/MOV or parsing fails.
func mp4Duration(path string) int {
	f, err := os.Open(path)
	if err != nil {
		return 0
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		return 0
	}

	secs, _ := findMvhd(f, fi.Size())
	return secs
}

func findMvhd(r io.ReadSeeker, limit int64) (int, bool) {
	for {
		cur, _ := r.Seek(0, io.SeekCurrent)
		if cur >= limit {
			return 0, false
		}

		var hdr [8]byte
		if _, err := io.ReadFull(r, hdr[:]); err != nil {
			return 0, false
		}
		boxSize := int64(binary.BigEndian.Uint32(hdr[:4]))
		name := string(hdr[4:8])

		var payload int64
		switch boxSize {
		case 1:
			var ext uint64
			if err := binary.Read(r, binary.BigEndian, &ext); err != nil {
				return 0, false
			}
			boxSize = int64(ext)
			payload = boxSize - 16
		case 0:
			boxSize = limit - cur
			payload = boxSize - 8
		default:
			payload = boxSize - 8
		}

		dataStart, _ := r.Seek(0, io.SeekCurrent)

		switch name {
		case "moov":
			if secs, ok := findMvhd(r, dataStart+payload); ok {
				return secs, true
			}
		case "mvhd":
			return parseMvhd(r)
		}

		if _, err := r.Seek(dataStart+payload, io.SeekStart); err != nil {
			return 0, false
		}
	}
}

func parseMvhd(r io.ReadSeeker) (int, bool) {
	var version uint8
	if err := binary.Read(r, binary.BigEndian, &version); err != nil {
		return 0, false
	}
	r.Seek(3, io.SeekCurrent) // flags

	var timescale uint32
	var duration uint64

	if version == 1 {
		r.Seek(16, io.SeekCurrent) // creation_time (8) + modification_time (8)
		if err := binary.Read(r, binary.BigEndian, &timescale); err != nil {
			return 0, false
		}
		if err := binary.Read(r, binary.BigEndian, &duration); err != nil {
			return 0, false
		}
	} else {
		r.Seek(8, io.SeekCurrent) // creation_time (4) + modification_time (4)
		var dur32 uint32
		if err := binary.Read(r, binary.BigEndian, &timescale); err != nil {
			return 0, false
		}
		if err := binary.Read(r, binary.BigEndian, &dur32); err != nil {
			return 0, false
		}
		duration = uint64(dur32)
	}

	if timescale == 0 {
		return 0, false
	}
	return int(duration / uint64(timescale)), true
}
