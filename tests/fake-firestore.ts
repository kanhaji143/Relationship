/**
 * Minimal in-memory Firestore double for route tests.
 *
 * Supports only the shapes the chat/safety routes use: doc refs, subcollection
 * refs, equality `where` queries and transactional reads/writes.
 */

export type DocData = Record<string, unknown>;

type QueryTarget = {
  kind: "query";
  path: string;
  field?: string;
  value?: unknown;
  orderField?: string;
  orderDirection?: "asc" | "desc";
  max?: number;
  limit: (count: number) => QueryTarget;
  get: () => Promise<QuerySnapshot>;
};
type Target = { path: string } | QueryTarget;

export type FakeWrite = {
  kind: "set" | "create" | "update" | "delete";
  path: string;
  value?: DocData;
};

type QueryDoc = {
  id: string;
  exists: true;
  data: () => DocData;
  get: (field: string) => unknown;
  ref: { path: string };
};

type QuerySnapshot = { docs: QueryDoc[]; size: number; empty: boolean };

function isQuery(target: Target): target is QueryTarget {
  return "kind" in target && target.kind === "query";
}

export function createFakeDb(initial: Record<string, DocData> = {}) {
  const documents = new Map<string, DocData>(Object.entries(initial));
  const writes: FakeWrite[] = [];
  let autoId = 0;

  const snapshot = (path: string) => {
    const data = documents.get(path);
    return {
      exists: data !== undefined,
      id: path.split("/").pop(),
      data: () => data,
      get: (field: string) => data?.[field],
      ref: { path },
    };
  };

  const read = async (target: Target): Promise<QuerySnapshot | ReturnType<typeof snapshot>> => {
    if (!isQuery(target)) return snapshot(target.path);

    const prefix = `${target.path}/`;
    const docs = [...documents.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
      .filter(([, data]) => target.field === undefined || data[target.field] === target.value)
      .sort(([, a], [, b]) => {
        if (!target.orderField) return 0;
        const left = a[target.orderField] as { toMillis?: () => number } | number | undefined;
        const right = b[target.orderField] as { toMillis?: () => number } | number | undefined;
        const toNumber = (value: typeof left) =>
          typeof value === "number" ? value : (value?.toMillis?.() ?? 0);
        return target.orderDirection === "desc"
          ? toNumber(right) - toNumber(left)
          : toNumber(left) - toNumber(right);
      })
      .slice(0, target.max ?? Number.POSITIVE_INFINITY)
      .map(([path, data]) => ({
        id: path.slice(prefix.length),
        exists: true as const,
        data: () => data,
        get: (field: string) => data[field],
        ref: { path },
      }));

    return { docs, size: docs.length, empty: docs.length === 0 };
  };

  const query = (target: Omit<QueryTarget, "limit" | "get">): QueryTarget => {
    const self: QueryTarget = {
      ...target,
      limit: (count) => {
        self.max = count;
        return self;
      },
      get: async () => (await read(self)) as QuerySnapshot,
    };
    return self;
  };

  const ref = (path: string) => ({
    path,
    id: path.split("/").pop(),
    collection: (name: string) => collection(`${path}/${name}`),
    get: async () => snapshot(path),
  });

  const collection = (path: string) => ({
    doc: (id?: string) => ref(`${path}/${id ?? `auto-${++autoId}`}`),
    where: (field: string, _operator: "==", value: unknown): QueryTarget =>
      query({ kind: "query", path, field, value }),
    orderBy: (field: string, direction: "asc" | "desc" = "asc"): QueryTarget =>
      query({ kind: "query", path, orderField: field, orderDirection: direction }),
  });

  const transaction = {
    get: read,
    set: (target: { path: string }, value: DocData) => {
      documents.set(target.path, { ...documents.get(target.path), ...value });
      writes.push({ kind: "set", path: target.path, value });
    },
    create: (target: { path: string }, value: DocData) => {
      if (documents.has(target.path)) throw new Error(`already exists: ${target.path}`);
      documents.set(target.path, value);
      writes.push({ kind: "create", path: target.path, value });
    },
    update: (target: { path: string }, value: DocData) => {
      const existing = documents.get(target.path);
      if (!existing) throw new Error(`missing: ${target.path}`);
      documents.set(target.path, { ...existing, ...value });
      writes.push({ kind: "update", path: target.path, value });
    },
    delete: (target: { path: string }) => {
      documents.delete(target.path);
      writes.push({ kind: "delete", path: target.path });
    },
  };

  const db = {
    doc: ref,
    collection,
    runTransaction: async <T>(callback: (tx: typeof transaction) => Promise<T>): Promise<T> =>
      callback(transaction),
  };

  return {
    db,
    documents,
    writes,
    exists: (path: string) => documents.has(path),
    data: (path: string) => documents.get(path),
  };
}
