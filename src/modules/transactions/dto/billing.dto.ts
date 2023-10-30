export class UpdateBillingPayloadDto {
  guid: string;

  memberGuid: string;

  invoiceNo: string;

  koperasiGuid: string;

  branchGuid: string;

  referenceNumber: string;

  periodGuid: string;

  amount: number;

  convenienceFee: number;

  chargedAmount: number;

  status: number;

  product: string;

  description: string;

  paymentMethod: string;

  paymentCode: string;

  createdAt: number[];

  updatedAt: number[];
}
