const MAX_ENTRIES = 100;

export class TtlCache<V> {
  private readonly values = new Map<string, { value: V; expiresAt: number }>();
  constructor(private readonly ttlMs: number) {}
  get(key: string): V | undefined {
    const hit = this.values.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) return undefined;
    return hit.value;
  }
  getStale(key: string): V | undefined {
    return this.values.get(key)?.value;
  }
  set(key: string, value: V): void {
    if (this.values.size >= MAX_ENTRIES && !this.values.has(key)) this.values.delete(this.values.keys().next().value as string);
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
