export function merge<T extends Record<string, any>>(...configs: Array<Partial<T> | undefined>): T {
  const isObj = (v: unknown) => v !== null && typeof v === "object" && !Array.isArray(v);

  return configs.reduceRight(
    (out, config) => {
      if (!config) return out;

      for (const key in config) {
        const value = config[key];

        if (value === undefined) continue;

        out[key] = isObj(out[key]) && isObj(value) ? merge(value, out[key]) : value;
      }

      return out;
    },
    {} as Record<string, any>,
  ) as T;
}
