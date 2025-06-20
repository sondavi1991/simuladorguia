export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "admin" | "distributor";
  whatsapp?: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "closed" | "lost";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Distributor {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  state: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date | string;
  updatedAt: Date | string;
} 