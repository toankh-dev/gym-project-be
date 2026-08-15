import { Model, Optional } from 'sequelize';
import { Member } from './Member.model';
import { User } from './User.model';
export interface MembershipPackageAttributes {
    id: number;
    name: string;
    durationMonths: number;
    price: number;
    description?: string;
    benefits?: string;
    maxSessions?: number;
    allowTrainer: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}
export interface MemberSubscriptionAttributes {
    id: number;
    memberId: number;
    packageId: number;
    startDate: Date;
    endDate: Date;
    actualPrice: number;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    renewalReminderSent: boolean;
    renewalReminderSentAt?: Date;
    registeredBy?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface MembershipPackageCreationAttributes extends Optional<MembershipPackageAttributes, 'id' | 'description' | 'benefits' | 'maxSessions' | 'createdAt' | 'updatedAt'> {
}
export interface MemberSubscriptionCreationAttributes extends Optional<MemberSubscriptionAttributes, 'id' | 'renewalReminderSent' | 'renewalReminderSentAt' | 'registeredBy' | 'createdAt' | 'updatedAt'> {
}
export declare class MembershipPackage extends Model<MembershipPackageAttributes, MembershipPackageCreationAttributes> implements MembershipPackageAttributes {
    id: number;
    name: string;
    durationMonths: number;
    price: number;
    description?: string;
    benefits?: string;
    maxSessions?: number;
    allowTrainer: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isActive(): boolean;
    getMonthlyPrice(): number;
}
export declare class MemberSubscription extends Model<MemberSubscriptionAttributes, MemberSubscriptionCreationAttributes> implements MemberSubscriptionAttributes {
    id: number;
    memberId: number;
    packageId: number;
    startDate: Date;
    endDate: Date;
    actualPrice: number;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    renewalReminderSent: boolean;
    renewalReminderSentAt?: Date;
    registeredBy?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    member?: Member;
    package?: MembershipPackage;
    registeredByUser?: User;
    isActive(): boolean;
    isExpired(): boolean;
    getDaysRemaining(): number;
}
//# sourceMappingURL=Subscription.model.d.ts.map