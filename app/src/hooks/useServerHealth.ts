import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { toast } from '../utils/toast'

export function useServerHealth() {
  const wasOffline = useRef(false)

  const { isError } = useQuery({
    queryKey: ['__health'],
    queryFn: () => api.get('/health'),
    retry: 1,
    retryDelay: 5_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (isError) {
      wasOffline.current = true
    } else if (wasOffline.current) {
      wasOffline.current = false
      toast.success('Reconnected to CardBridge')
    }
  }, [isError])

  return { offline: isError }
}
