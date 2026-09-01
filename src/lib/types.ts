export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string;
  balance: number;
  isAdmin: boolean;
  isAffiliate: boolean;
  referralCode: string | null;
  isCambista: boolean;
  cambistaCode: string | null;
};
