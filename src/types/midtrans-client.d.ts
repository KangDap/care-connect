declare module 'midtrans-client' {
  export type SnapConfig = {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  };

  export class Snap {
    constructor(config: SnapConfig);

    createTransaction<T = unknown>(payload: unknown): Promise<T>;
    createTransactionToken(payload: unknown): Promise<string>;
    transaction: {
      notification<T = unknown>(payload: unknown): Promise<T>;
      status<T = unknown>(orderId: string): Promise<T>;
      cancel<T = unknown>(orderId: string): Promise<T>;
      expire<T = unknown>(orderId: string): Promise<T>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
  };

  export default midtransClient;
}
