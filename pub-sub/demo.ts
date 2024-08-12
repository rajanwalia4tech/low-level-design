class Message {
    constructor(public content: string) {}
}

interface Subscriber {
    onMessage(message: Message): void;
}


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

class Topic {
    private subscribers: Set<Subscriber>;
    private mutex: Mutex;

    constructor(private name: string) {
        this.subscribers = new Set<Subscriber>();
        this.mutex = new Mutex();
    }

    public getName(): string {
        return this.name;
    }

    public async addSubscriber(subscriber: Subscriber): Promise<void> {
        await this.mutex.dispatch(() => {
            this.subscribers.add(subscriber);
        });
    }

    public async removeSubscriber(subscriber: Subscriber): Promise<void> {
        await this.mutex.dispatch(() => {
            this.subscribers.delete(subscriber);
        });
    }

    public async publish(message: Message): Promise<void> {
        await this.mutex.dispatch(async () => {
            for (const subscriber of this.subscribers) {
                subscriber.onMessage(message);
            }
        });
    }
}

class Publisher {
    private topics: Set<Topic>;
    private mutex: Mutex;

    constructor() {
        this.topics = new Set<Topic>();
        this.mutex = new Mutex();
    }

    public async registerTopic(topic: Topic): Promise<void> {
        await this.mutex.dispatch(() => {
            this.topics.add(topic);
        });
    }

    public async publish(topic: Topic, message: Message): Promise<void> {
        await this.mutex.dispatch(async () => {
            if (!this.topics.has(topic)) {
                console.log(`This publisher can't publish to topic: ${topic.getName()}`);
                return;
            }
            await topic.publish(message);
        });
    }
}


class PrintSubscriber implements Subscriber {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public onMessage(message: Message): void {
        console.log(`Subscriber ${this.name} received message: ${message.content}`);
    }
}

class PubSubSystemDemo {
    public static async run(): Promise<void> {
        // Create topics
        const topic1 = new Topic('Topic1');
        const topic2 = new Topic('Topic2');

        // Create publishers
        const publisher1 = new Publisher();
        const publisher2 = new Publisher();

        // Create subscribers
        const subscriber1 = new PrintSubscriber('Subscriber1');
        const subscriber2 = new PrintSubscriber('Subscriber2');
        const subscriber3 = new PrintSubscriber('Subscriber3');

        // Register topics with publishers
        await publisher1.registerTopic(topic1);
        await publisher2.registerTopic(topic2);

        // Subscribe to topics
        await topic1.addSubscriber(subscriber1);
        await topic1.addSubscriber(subscriber2);
        await topic2.addSubscriber(subscriber2);
        await topic2.addSubscriber(subscriber3);

        // Publish messages
        await publisher1.publish(topic1, new Message('Message1 for Topic1'));
        await publisher1.publish(topic1, new Message('Message2 for Topic1'));
        await publisher2.publish(topic2, new Message('Message1 for Topic2'));

        // Unsubscribe from a topic
        await topic1.removeSubscriber(subscriber2);

        // Publish more messages
        await publisher1.publish(topic1, new Message('Message3 for Topic1'));
        await publisher2.publish(topic2, new Message('Message2 for Topic2'));
    }
}

// Run the demo
PubSubSystemDemo.run().catch(console.error);
