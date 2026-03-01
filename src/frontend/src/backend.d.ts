import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Clip {
    startTrim: number;
    endTrim: number;
    name: string;
    durationSeconds: number;
    blobId: string;
    orderIndex: bigint;
}
export interface TextOverlay {
    xPercent: number;
    color: string;
    text: string;
    yPercent: number;
    fontFamily: string;
    fontSize: bigint;
}
export interface Project {
    activePreset: string;
    title: string;
    clips: Array<Clip>;
    createdAt: bigint;
    textOverlays: Array<TextOverlay>;
    updatedAt: bigint;
}
export interface SubscriptionStatus {
    plan: string;
    upgradeDate?: bigint;
}
export interface UserProfile {
    displayName: string;
    createdAt: bigint;
    plan: string;
    totalUsageMinutes: bigint;
    projectCount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(title: string, clips: Array<Clip>, textOverlays: Array<TextOverlay>, activePreset: string): Promise<Project>;
    deleteProject(projectId: string): Promise<void>;
    downgradeSubscription(): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProject(projectId: string): Promise<Project>;
    getSubscriptionStatus(): Promise<SubscriptionStatus>;
    getUsageStats(): Promise<{
        totalUsageMinutes: bigint;
        projectCount: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listFavoritePresets(): Promise<Array<string>>;
    listProjects(): Promise<Array<Project>>;
    removeFavoritePreset(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFavoritePreset(name: string): Promise<void>;
    trackUsage(minutes: bigint): Promise<void>;
    updateProject(projectId: string, title: string, clips: Array<Clip>, textOverlays: Array<TextOverlay>, activePreset: string): Promise<Project>;
    updateUserProfile(displayName: string): Promise<UserProfile>;
    upgradeSubscription(): Promise<void>;
}
