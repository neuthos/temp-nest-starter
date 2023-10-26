// {
//   "success": true, //required
//   "response_code": "00", //required
//   "message": "success", //required
//   "transaction_id": "20220629145120", //required
//   "data": {
//       "destination": "082119756695", //required
//       "sku": "F12TSEL010", //required
//       "serial_number": "20220702101063",
//       "total_price": 10670, //required (buy price from biller)
//       "description": "Pulsa Telkomsel 10rb",
//       "additional_data": null,
//       "error": ""
//   }
// }

export interface ApiTrxResponse {
  success: boolean;
  response_code: string;
  message: string;
  transaction_id: string;
  data: {
    destination: string;
    sku: string;
    serial_number: string;
    total_price: number;
  };
}

export interface ApiHeaderFormat {
  'X-TIMESTAMP': string;
  'PUBLIC-KEY': string;
  'SIGNATURE': string;
}
