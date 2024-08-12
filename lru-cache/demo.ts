class Mutex {
    private mutex = Promise.resolve();

    lock(): Promise<() => void> {
        let begin: (unlock: () => void) => void = (unlock) => {};

        this.mutex = this.mutex.then(() => {
            return new Promise(begin);
        });

        return new Promise(res => {
            begin = res;
        });
    }

    async dispatch<T>(fn: () => T | Promise<T>): Promise<T> {
        const unlock = await this.lock();
        try {
            return await fn();
        } finally {
            unlock();
        }
    }
}

class Node1<K, V> {
    key: K;
    value: V;
    prev: Node1<K, V> | null = null;
    next: Node1<K, V> | null = null;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, Node1<K, V>>;
    private head: Node1<K, V>;
    private tail: Node1<K, V>;
    private mutex: Mutex;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map<K, Node1<K, V>>();
        this.head = new Node1<K, V>(null as any, null as any);
        this.tail = new Node1<K, V>(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.mutex = new Mutex();
    }

    public async get(key: K): Promise<V | null> {
        return this.mutex.dispatch(() => {
            const node = this.cache.get(key);
            if (!node) {
                return null;
            }
            this.moveToHead(node);
            return node.value;
        });
    }

    public async put(key: K, value: V): Promise<void> {
        return this.mutex.dispatch(() => {
            let node = this.cache.get(key);
            if (node) {
                node.value = value;
                this.moveToHead(node);
            } else {
                node = new Node1<K, V>(key, value);
                this.cache.set(key, node);
                this.addToHead(node);

                if (this.cache.size > this.capacity) {
                    const removedNode = this.removeTail();
                    if (removedNode.key !== null) {
                        this.cache.delete(removedNode.key);
                    }
                }
            }
        });
    }

    private addToHead(node: Node1<K, V>): void {
        node.prev = this.head;
        node.next = this.head.next;
        if (this.head.next) {
            this.head.next.prev = node;
        }
        this.head.next = node;
    }

    private removeNode(node: Node1<K, V>): void {
        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
    }

    private moveToHead(node: Node1<K, V>): void {
        this.removeNode(node);
        this.addToHead(node);
    }

    private removeTail(): Node1<K, V> {
        const node = this.tail.prev!;
        this.removeNode(node);
        return node;
    }
}

// Example usage
(async () => {
    const lruCache = new LRUCache<string, number>(10);

    await lruCache.put('a', 1);
    await lruCache.put('b', 2);
    await lruCache.put('c', 3);

    console.log(await lruCache.get('a')); // Outputs: 1
    console.log(await lruCache.get('f')); // Outputs: 1
    await lruCache.put('d', 4); // Evicts key 'b'

    console.log(await lruCache.get('b')); // Outputs: null
})();
