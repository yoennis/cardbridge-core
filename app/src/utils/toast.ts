import { toast as t } from 'sonner'

export const toast = {
  success: (msg: string) => t.success(msg),
  error: (msg: string) => t.error(msg),
  info: (msg: string) => t(msg),
  promise: <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => t.promise(promise, msgs),
}
