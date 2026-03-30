import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";

import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Folder and File Types
  type Folder = {
    id : Text;
    name : Text;
    parentFolderId : ?Text; // null means root
    createdBy : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  module Folder {
    public func compare(folder1 : Folder, folder2 : Folder) : Order.Order {
      Text.compare(folder1.id, folder2.id);
    };
  };

  type FileMetadata = {
    id : Text;
    name : Text;
    size : Nat;
    mimeType : Text;
    folderId : ?Text; // null means root
    createdBy : Principal;
    createdAt : Int;
    blob : Storage.ExternalBlob;
  };

  module FileMetadata {
    public func compare(file1 : FileMetadata, file2 : FileMetadata) : Order.Order {
      Text.compare(file1.id, file2.id);
    };
  };

  let folders = Map.empty<Text, Folder>();
  let files = Map.empty<Text, FileMetadata>();
  let usedStorage = Map.empty<Principal, Nat>();

  public type FolderInput = {
    id : Text;
    name : Text;
    parentFolderId : ?Text;
  };

  // Folder Management Functions
  public query ({ caller }) func getCallerFolders() : async [Folder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access folders");
    };
    folders.values().toArray().filter(func(f) { f.createdBy == caller });
  };

  public query ({ caller }) func getFolders() : async [Folder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all folders");
    };
    folders.values().toArray();
  };

  public query ({ caller }) func getFolder(folderId : Text) : async Folder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access folders");
    };
    switch (folders.get(folderId)) {
      case (null) { Runtime.trap("Folder does not exist") };
      case (?folder) {
        if (folder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own folders");
        };
        folder;
      };
    };
  };

  public shared ({ caller }) func createFolder(input : FolderInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create folders");
    };
    if (folders.containsKey(input.id)) {
      Runtime.trap("Folder already exists");
    };

    // Check that parent folder exists and belongs to caller (if not root)
    switch (input.parentFolderId) {
      case (?parentId) {
        switch (folders.get(parentId)) {
          case (null) { Runtime.trap("Parent folder does not exist") };
          case (?parentFolder) {
            if (parentFolder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Parent folder does not belong to you");
            };
          };
        };
      };
      case (null) {};
    };

    let folder : Folder = {
      id = input.id;
      name = input.name;
      parentFolderId = input.parentFolderId;
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    folders.add(input.id, folder);
  };

  public shared ({ caller }) func updateFolder(input : FolderInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update folders");
    };
    switch (folders.get(input.id)) {
      case (null) { Runtime.trap("Folder does not exist") };
      case (?folder) {
        if (folder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own folders");
        };
        
        // Check that new parent folder exists and belongs to caller (if not root)
        switch (input.parentFolderId) {
          case (?parentId) {
            switch (folders.get(parentId)) {
              case (null) { Runtime.trap("Parent folder does not exist") };
              case (?parentFolder) {
                if (parentFolder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                  Runtime.trap("Unauthorized: Parent folder does not belong to you");
                };
              };
            };
          };
          case (null) {};
        };

        let updatedFolder : Folder = {
          id = input.id;
          name = input.name;
          parentFolderId = input.parentFolderId;
          createdBy = folder.createdBy;
          createdAt = folder.createdAt;
          updatedAt = Time.now();
        };
        folders.add(input.id, updatedFolder);
      };
    };
  };

  public shared ({ caller }) func deleteFolder(folderId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete folders");
    };
    switch (folders.get(folderId)) {
      case (null) { Runtime.trap("Folder does not exist") };
      case (?folder) {
        if (folder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own folders");
        };
      };
    };
    folders.remove(folderId);
  };

  // File Management Functions
  public query ({ caller }) func getCallerFiles() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access files");
    };
    files.values().toArray().filter(func(f) { f.createdBy == caller });
  };

  public query ({ caller }) func getFiles() : async [FileMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all files");
    };
    files.values().toArray();
  };

  public query ({ caller }) func getFile(fileId : Text) : async FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access files");
    };
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File does not exist") };
      case (?file) {
        if (file.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own files");
        };
        file;
      };
    };
  };

  public shared ({ caller }) func saveFile(fileId : Text, file : FileMetadata) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };
    if (file.size > 2_000_000_000_000) {
      Runtime.trap("File size exceeds 2TB limit");
    };
    if (files.containsKey(fileId)) {
      Runtime.trap("File already exists");
    };
    if (file.size == 0) {
      Runtime.trap("File size cannot be 0");
    };
    // Check that target folder exists and belongs to caller (if not root)
    switch (file.folderId) {
      case (?parentId) {
        switch (folders.get(parentId)) {
          case (null) { Runtime.trap("Target folder does not exist") };
          case (?targetFolder) {
            if (targetFolder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Target folder does not belong to you");
            };
          };
        };
      };
      case (null) {};
    };

    let newFile : FileMetadata = {
      id = fileId;
      name = file.name;
      size = file.size;
      mimeType = file.mimeType;
      folderId = file.folderId;
      createdBy = caller;
      createdAt = Time.now();
      blob = file.blob;
    };

    files.add(fileId, newFile);

    let currentUsage = switch (usedStorage.get(caller)) {
      case (null) { files.values().toArray().filter(func(f) { f.createdBy == caller }).map(func(f) { f.size }).foldLeft(0, Nat.add) };
      case (?usage) { usage };
    };
    usedStorage.add(caller, currentUsage + newFile.size);
  };

  type FolderContent = {
    files : [FileMetadata];
    subfolders : [Folder];
  };

  public query ({ caller }) func getFolderContents(folderId : ?Text) : async FolderContent {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access folder contents");
    };

    // If folderId is specified, verify it exists and belongs to caller
    switch (folderId) {
      case (?id) {
        switch (folders.get(id)) {
          case (null) { Runtime.trap("Folder does not exist") };
          case (?folder) {
            if (folder.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only access your own folders");
            };
          };
        };
      };
      case (null) {};
    };

    let filesInFolder = List.empty<FileMetadata>();
    let subfoldersInFolder = List.empty<Folder>();

    for ((_, file) in files.entries()) {
      if (file.folderId == folderId and file.createdBy == caller) {
        filesInFolder.add(file);
      };
    };

    for ((_, folder) in folders.entries()) {
      if (folder.parentFolderId == folderId and folder.createdBy == caller) {
        subfoldersInFolder.add(folder);
      };
    };

    {
      files = filesInFolder.toArray();
      subfolders = subfoldersInFolder.toArray();
    };
  };

  public query ({ caller }) func getUsedStorage() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check storage usage");
    };
    switch (usedStorage.get(caller)) {
      case (?usage) { usage };
      case (null) { 0 };
    };
  };
};
