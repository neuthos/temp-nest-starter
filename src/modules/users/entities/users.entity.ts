import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'company_id', type: 'uuid', default: null })
  company_id: string;

  @Column({ default: null })
  name?: string;

  @Column({ default: null })
  email?: string;

  @Column({ default: null })
  nik?: string;

  @Column({ default: null })
  pin?: string;

  @Column({ name: 'phone_number', default: null })
  phoneNumber?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
