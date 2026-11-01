import { useEffect, useState } from "react";

export function useSavedValue<T>(value: T, save: (value: T) => Promise<void>, ready: boolean, retry: number): boolean {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void Promise.resolve().then(() => save(value)).then(() => {
      if (active) setFailed(false);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [ready, retry, save, value]);
  return failed;
}
