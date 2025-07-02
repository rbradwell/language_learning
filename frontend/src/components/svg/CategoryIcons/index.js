// CategoryIcons/index.js
import React from 'react';
import Greetings from './Greetings';
import FamilyAndRelationships from './FamilyAndRelationships';
import FoodAndDining from './FoodAndDining';
import ShoppingAndMoney from './ShoppingAndMoney';
import Transport from './Transport';
import WorkAndSchool from './WorkAndSchool';
import HealthAndBody from './HealthAndBody';
import WeatherAndTime from './WeatherAndTime';

// Icon registry mapping iconPath to component
const iconRegistry = {
  Greetings,
  FamilyAndRelationships,
  FoodAndDining,
  ShoppingAndMoney,
  Transport,
  WorkAndSchool,
  HealthAndBody,
  WeatherAndTime,
};

// Default fallback icon (you can create a generic one or use an existing one)
const DefaultIcon = ({ width = 64, height = 64, ...props }) => (
  <Greetings width={width} height={height} {...props} />
);

/**
 * CategoryIcon component that dynamically renders the correct icon
 * based on the iconPath prop from the database
 */
const CategoryIcon = ({ iconPath, width = 64, height = 64, ...props }) => {
  // Get the icon component from the registry
  const IconComponent = iconPath ? iconRegistry[iconPath] : null;
  
  // If no icon found or no iconPath provided, use default
  if (!IconComponent) {
    return <DefaultIcon width={width} height={height} {...props} />;
  }
  
  return <IconComponent width={width} height={height} {...props} />;
};

export default CategoryIcon;
export { iconRegistry };