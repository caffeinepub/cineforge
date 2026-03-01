import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Int "mo:core/Int";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserProfile = {
    displayName : Text;
    plan : Text; // "free" or "pro"
    createdAt : Int;
    projectCount : Nat;
    totalUsageMinutes : Nat;
  };

  public type Clip = {
    blobId : Text;
    name : Text;
    durationSeconds : Float;
    startTrim : Float;
    endTrim : Float;
    orderIndex : Nat;
  };

  public type TextOverlay = {
    text : Text;
    xPercent : Float;
    yPercent : Float;
    fontSize : Nat;
    color : Text;
    fontFamily : Text;
  };

  public type Project = {
    title : Text;
    clips : [Clip];
    textOverlays : [TextOverlay];
    activePreset : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  module Project {
    public func compare(a : (Text, Project), b : (Text, Project)) : Order.Order {
      switch (Int.compare(a.1.createdAt, b.1.createdAt)) {
        case (#equal) { Text.compare(a.0, b.0) };
        case (order) { order };
      };
    };
  };

  public type SubscriptionStatus = {
    plan : Text;
    upgradeDate : ?Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let projects = Map.empty<Principal, Map.Map<Text, Project>>();
  let favoritePresets = Map.empty<Principal, List.List<Text>>();
  let subscriptions = Map.empty<Principal, SubscriptionStatus>();

  // Required profile management functions
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

  // Internal helper function to get or create profile
  private func getOrCreateUserProfile(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        let newProfile : UserProfile = {
          displayName = "New User";
          plan = "free";
          createdAt = Time.now();
          projectCount = 0;
          totalUsageMinutes = 0;
        };
        userProfiles.add(caller, newProfile);
        newProfile;
      };
    };
  };

  public shared ({ caller }) func updateUserProfile(displayName : Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let existingProfile = getOrCreateUserProfile(caller);
    let updatedProfile = {
      existingProfile with displayName;
    };
    userProfiles.add(caller, updatedProfile);
    updatedProfile;
  };

  public shared ({ caller }) func createProject(title : Text, clips : [Clip], textOverlays : [TextOverlay], activePreset : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };

    let userProfile = getOrCreateUserProfile(caller);

    if (userProfile.plan == "free" and userProfile.projectCount >= 3) {
      Runtime.trap("Free plan limited to 3 projects");
    };

    if (clips.size() > 20) {
      Runtime.trap("A project can have up to 20 clips");
    };

    let projectId = Time.now().toText();
    let newProject : Project = {
      title;
      clips;
      textOverlays;
      activePreset;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    let userProjects = switch (projects.get(caller)) {
      case (?existing) { existing };
      case (null) { Map.empty<Text, Project>() };
    };

    userProjects.add(projectId, newProject);
    projects.add(caller, userProjects);

    let updatedUserProfile = {
      userProfile with projectCount = userProfile.projectCount + 1;
    };
    userProfiles.add(caller, updatedUserProfile);

    newProject;
  };

  public query ({ caller }) func getProject(projectId : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access projects");
    };

    switch (projects.get(caller)) {
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (?project) { project };
          case (null) { Runtime.trap("Project not found") };
        };
      };
      case (null) { Runtime.trap("No projects found for user") };
    };
  };

  public query ({ caller }) func listProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list projects");
    };

    switch (projects.get(caller)) {
      case (?userProjects) {
        userProjects.values().toArray();
      };
      case (null) { [] : [Project] };
    };
  };

  public shared ({ caller }) func updateProject(projectId : Text, title : Text, clips : [Clip], textOverlays : [TextOverlay], activePreset : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };

    if (clips.size() > 20) {
      Runtime.trap("A project can have up to 20 clips");
    };

    switch (projects.get(caller)) {
      case (?userProjects) {
        switch (userProjects.get(projectId)) {
          case (?existingProject) {
            let updatedProject : Project = {
              title;
              clips;
              textOverlays;
              activePreset;
              createdAt = existingProject.createdAt;
              updatedAt = Time.now();
            };
            userProjects.add(projectId, updatedProject);
            updatedProject;
          };
          case (null) { Runtime.trap("Project not found") };
        };
      };
      case (null) { Runtime.trap("No projects found for user") };
    };
  };

  public shared ({ caller }) func deleteProject(projectId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };

    let userProfile = getOrCreateUserProfile(caller);

    switch (projects.get(caller)) {
      case (?userProjects) {
        if (not userProjects.containsKey(projectId)) {
          Runtime.trap("Project not found");
        };

        userProjects.remove(projectId);
        let updatedUserProfile = {
          userProfile with projectCount = userProfile.projectCount - 1;
        };
        userProfiles.add(caller, updatedUserProfile);
      };
      case (null) { Runtime.trap("No projects found for user") };
    };
  };

  public shared ({ caller }) func upgradeSubscription() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upgrade subscription");
    };

    let status : SubscriptionStatus = {
      plan = "pro";
      upgradeDate = ?Time.now();
    };
    subscriptions.add(caller, status);

    let userProfile = getOrCreateUserProfile(caller);
    let updatedProfile = {
      userProfile with plan = "pro";
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func downgradeSubscription() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can downgrade subscription");
    };

    let status : SubscriptionStatus = {
      plan = "free";
      upgradeDate = null;
    };
    subscriptions.add(caller, status);

    let userProfile = getOrCreateUserProfile(caller);
    let updatedProfile = {
      userProfile with plan = "free";
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getSubscriptionStatus() : async SubscriptionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscription status");
    };

    switch (subscriptions.get(caller)) {
      case (?status) { status };
      case (null) {
        {
          plan = "free";
          upgradeDate = null;
        };
      };
    };
  };

  public shared ({ caller }) func trackUsage(minutes : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can track usage");
    };

    let userProfile = getOrCreateUserProfile(caller);
    let updatedProfile = {
      userProfile with totalUsageMinutes = userProfile.totalUsageMinutes + minutes;
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getUsageStats() : async { totalUsageMinutes : Nat; projectCount : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view usage stats");
    };

    let userProfile = switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found") };
    };
    {
      totalUsageMinutes = userProfile.totalUsageMinutes;
      projectCount = userProfile.projectCount;
    };
  };

  public shared ({ caller }) func saveFavoritePreset(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save favorite presets");
    };

    let userPresets = switch (favoritePresets.get(caller)) {
      case (?presets) { presets };
      case (null) { List.empty<Text>() };
    };

    let currentSize = userPresets.toArray().size();
    if (currentSize >= 10) {
      Runtime.trap("You can only have up to 10 favorite presets");
    };

    if (userPresets.any(func(preset) { preset == name })) {
      Runtime.trap("Preset already exists in favorites");
    };

    userPresets.add(name);
    favoritePresets.add(caller, userPresets);
  };

  public query ({ caller }) func listFavoritePresets() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list favorite presets");
    };

    switch (favoritePresets.get(caller)) {
      case (?presets) { presets.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func removeFavoritePreset(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove favorite presets");
    };

    switch (favoritePresets.get(caller)) {
      case (?presets) {
        let filtered = presets.filter(func(preset) { preset != name });
        favoritePresets.add(caller, filtered);
      };
      case (null) { Runtime.trap("No favorite presets found for user") };
    };
  };
};
