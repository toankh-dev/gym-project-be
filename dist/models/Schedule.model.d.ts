import { Model, Optional } from 'sequelize';
import { Trainer } from './Trainer.model';
import { Member } from './Member.model';
export interface TrainingScheduleAttributes {
    id: number;
    className: string;
    trainerId: number;
    classType: 'GROUP_CLASS' | 'PERSONAL_TRAINING' | 'WORKSHOP';
    description?: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    maxCapacity: number;
    currentEnrollment: number;
    pricePerSession?: number;
    location?: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
}
export interface TrainingScheduleCreationAttributes extends Optional<TrainingScheduleAttributes, 'id' | 'description' | 'currentEnrollment' | 'pricePerSession' | 'location' | 'createdAt' | 'updatedAt'> {
}
export interface ScheduleMemberAttributes {
    id: number;
    scheduleId: number;
    memberId: number;
    status: 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED';
    registeredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ScheduleMemberCreationAttributes extends Optional<ScheduleMemberAttributes, 'id' | 'registeredAt' | 'createdAt' | 'updatedAt'> {
}
export interface AttendanceLogAttributes {
    id: number;
    memberId: number;
    scheduleId?: number;
    checkinTime: Date;
    checkoutTime?: Date;
    attendanceType: 'GYM_VISIT' | 'TRAINING_SESSION' | 'GROUP_CLASS';
    createdAt: Date;
    updatedAt: Date;
}
export interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, 'id' | 'scheduleId' | 'checkoutTime' | 'createdAt' | 'updatedAt'> {
}
export declare class TrainingSchedule extends Model<TrainingScheduleAttributes, TrainingScheduleCreationAttributes> implements TrainingScheduleAttributes {
    id: number;
    className: string;
    trainerId: number;
    classType: 'GROUP_CLASS' | 'PERSONAL_TRAINING' | 'WORKSHOP';
    description?: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    maxCapacity: number;
    currentEnrollment: number;
    pricePerSession?: number;
    location?: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    trainer: Trainer;
    registeredMembers: ScheduleMember[];
    isActive(): boolean;
    isFull(): boolean;
    getAvailableSlots(): number;
    isInPast(): boolean;
    canBook(): boolean;
    getDuration(): number;
    static findByDate(date: Date): Promise<TrainingSchedule[]>;
    static findByTrainer(trainerId: number, startDate?: Date, endDate?: Date): Promise<TrainingSchedule[]>;
    static getUpcomingSchedules(limit?: number): Promise<TrainingSchedule[]>;
}
export declare class ScheduleMember extends Model<ScheduleMemberAttributes, ScheduleMemberCreationAttributes> implements ScheduleMemberAttributes {
    id: number;
    scheduleId: number;
    memberId: number;
    status: 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED';
    registeredAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    schedule: TrainingSchedule;
    member: Member;
    isActive(): boolean;
    hasAttended(): boolean;
    static findByMember(memberId: number): Promise<ScheduleMember[]>;
    static findBySchedule(scheduleId: number): Promise<ScheduleMember[]>;
}
export declare class AttendanceLog extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes> implements AttendanceLogAttributes {
    id: number;
    memberId: number;
    scheduleId?: number;
    checkinTime: Date;
    checkoutTime?: Date;
    attendanceType: 'GYM_VISIT' | 'TRAINING_SESSION' | 'GROUP_CLASS';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    member: Member;
    schedule?: TrainingSchedule;
    getDuration(): number | null;
    isCurrentlyCheckedIn(): boolean;
    static findByMember(memberId: number, startDate?: Date, endDate?: Date): Promise<AttendanceLog[]>;
    static getTodayAttendance(): Promise<AttendanceLog[]>;
    static getAttendanceStats(startDate: Date, endDate: Date): Promise<any>;
}
declare const _default: {
    TrainingSchedule: typeof TrainingSchedule;
    ScheduleMember: typeof ScheduleMember;
    AttendanceLog: typeof AttendanceLog;
};
export default _default;
//# sourceMappingURL=Schedule.model.d.ts.map