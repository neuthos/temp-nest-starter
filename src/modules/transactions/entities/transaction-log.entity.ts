/* eslint-disable import/no-cycle */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

export enum StatusLog {
  REQUEST = 'REQUEST',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum LabelLog {
  REQUEST_CREATE_BILLING = 'REQUEST_CREATE_BILLING',
  RESPONSE_CREATE_BILLING = 'RESPONSE_CREATE_BILLING',

  REQUEST_INFORM_PAYMENT_BILLING = 'REQUEST_INFORM_PAYMENT_BILLING',
  RESPONSE_INFORM_PAYMENT_BILLING = 'RESPONSE_INFORM_PAYMENT_BILLING',

  RESPONSE_MESSAGE_BILLING = 'RESPONSE_MESSAGE_BILLING',

  REQUEST_SUPPLIER = 'REQUEST_SUPPLIER',
  RESPONSE_SUPPLIER = 'RESPONSE_SUPPLIER',
  REQUEST_INQUIRY_SUPPLIER = 'REQUEST_INQUIRY_SUPPLIER',
  RESPONSE_INQUIRY_SUPPLIER = 'RESPONSE_INQUIRY_SUPPLIER',
  CALLBACK_SUPPLIER = 'CALLBACK_SUPPLIER',
}

@Entity()
export class TransactionLog {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('uuid')
  transaction_id: string;

  @Column({
    type: 'enum',
    enum: StatusLog,
  })
  status_log: string;

  @Column({
    type: 'enum',
    enum: LabelLog,
  })
  label_log: string;

  @Column('varchar')
  title: string;

  @Column('json')
  log: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @ManyToOne(() => Transaction, (transaction) => transaction.logs)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
