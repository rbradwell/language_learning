// This file has been removed as part of the Trails table elimination
// TrailSteps now connect directly to Categories
// This file should be deleted from the filesystem

// Temporary placeholder to prevent app crashes during transition
module.exports = () => {
  // Return a dummy model that won't be used
  return {
    name: 'Trail_DEPRECATED',
    associate: () => {},
    // Empty model that should never be used
  };
};