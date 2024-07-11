export interface CraftgenNodeConfig {
  name: string;
  description: string;
  icon: string;
  inputs: Record<string, SocketConfig>;
  outputs: Record<string, SocketConfig>;
}

export interface SocketConfig {
  type: string;
  description: string;
}
