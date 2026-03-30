import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface FolderInput {
    id: string;
    name: string;
    parentFolderId?: string;
}
export interface FileMetadata {
    id: string;
    blob: ExternalBlob;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    size: bigint;
    mimeType: string;
    folderId?: string;
}
export interface Folder {
    id: string;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    updatedAt: bigint;
    parentFolderId?: string;
}
export interface FolderContent {
    files: Array<FileMetadata>;
    subfolders: Array<Folder>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFolder(input: FolderInput): Promise<void>;
    deleteFolder(folderId: string): Promise<void>;
    getCallerFiles(): Promise<Array<FileMetadata>>;
    getCallerFolders(): Promise<Array<Folder>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFile(fileId: string): Promise<FileMetadata>;
    getFiles(): Promise<Array<FileMetadata>>;
    getFolder(folderId: string): Promise<Folder>;
    getFolderContents(folderId: string | null): Promise<FolderContent>;
    getFolders(): Promise<Array<Folder>>;
    getUsedStorage(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveFile(fileId: string, file: FileMetadata): Promise<void>;
    updateFolder(input: FolderInput): Promise<void>;
}
