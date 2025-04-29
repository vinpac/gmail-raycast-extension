import { useEffect, useMemo, useRef, useState } from 'react'

import { Cache } from '@raycast/api'
import { GoogleAPIFetch } from './gmail'
import { getSession } from './withGoogleCredentials'

const promiseCache: Map<string, Promise<unknown>> = new Map()
const dataCache = new Cache()
const errorCache: Map<string, Error> = new Map()

type Config<TData> = {
  id: string
  getData: (fetch: GoogleAPIFetch) => Promise<TData>
}

function getCachedData<Data>(id: string): Data | undefined {
  const rawData = dataCache.get(id)
  return rawData ? JSON.parse(rawData) : undefined
}

export function useGoogleAPI<Data>(config: Config<Data>) {
  const id = config.id
  const initialData = getCachedData<Data>(id)
  const session = getSession()
  const [isLoading, setIsLoading] = useState(true)
  const lastFetchedRef = useRef(false)
  const [data, setData] = useState<Data | undefined>(initialData ?? undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    async function syncData() {
      if (lastFetchedRef.current || !session) {
        return
      }

      lastFetchedRef.current = true
      let promise = promiseCache.get(id)

      if (!promise) {
        // eslint-disable-next-line no-inner-declarations
        async function fetchData() {
          try {
            const nextData = await config.getData(session.fetch)
            dataCache.set(id, JSON.stringify(nextData))
            errorCache.delete(id)
          } catch (error: unknown) {
            errorCache.set(id, error as Error)
            dataCache.remove(id)
          }
        }

        promise = fetchData()
        promiseCache.set(id, promise)
      }

      await promise

      const nextData = getCachedData<Data>(id)
      const nextError = errorCache.get(id)

      setIsLoading(false)

      if (nextError) {
        setData(undefined)
        setError(nextError)
      } else {
        setData(nextData as Data)
        setError(undefined)
      }
    }

    syncData()
  }, [id, config.getData, session])

  return useMemo(() => {
    if (!session) {
      return {
        isLoading: true,
        data,
        error: undefined,
      }
    }

    return {
      isLoading,
      data,
      error,
    }
  }, [isLoading, data, error])
}
