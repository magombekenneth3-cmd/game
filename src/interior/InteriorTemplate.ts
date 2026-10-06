import { BuildingClassification, InteriorRoomType, EnvironmentActivityTag } from './InteriorTypes';

export interface InteriorTemplateRoomSpec {
  roomType: InteriorRoomType;
  name: string;
  relativeMinX: number; // Normalized 0..1 bounding box within template
  relativeMinZ: number;
  relativeMaxX: number;
  relativeMaxZ: number;
  activityTags: EnvironmentActivityTag[];
}

export interface InteriorTemplateConfig {
  templateId: string;
  category: BuildingClassification;
  defaultWidth: number;
  defaultDepth: number;
  floors: number;
  roomSpecs: InteriorTemplateRoomSpec[];
  entranceCount: number;
  style: string;
}

export class InteriorTemplateRegistry {
  private static templates: Map<BuildingClassification, InteriorTemplateConfig> = new Map();

  public static initialize(): void {
    if (this.templates.size > 0) return;

    // 1. NIGHTCLUB TEMPLATE
    this.templates.set('NIGHTCLUB', {
      templateId: 'template_nightclub',
      category: 'NIGHTCLUB',
      defaultWidth: 24.0,
      defaultDepth: 20.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'ENTRY',
          name: 'Reception & Coat Check',
          relativeMinX: 0.35, relativeMinZ: 0.0, relativeMaxX: 0.65, relativeMaxZ: 0.25,
          activityTags: ['SOCIAL', 'SERVICES']
        },
        {
          roomType: 'MAIN_FLOOR',
          name: 'Main Dance Floor',
          relativeMinX: 0.2, relativeMinZ: 0.25, relativeMaxX: 0.8, relativeMaxZ: 0.7,
          activityTags: ['SOCIAL']
        },
        {
          roomType: 'BAR',
          name: 'Main Lounge Bar',
          relativeMinX: 0.0, relativeMinZ: 0.25, relativeMaxX: 0.2, relativeMaxZ: 0.7,
          activityTags: ['FOOD', 'SOCIAL']
        },
        {
          roomType: 'DJ_BOOTH',
          name: 'DJ Stage & Sound Control',
          relativeMinX: 0.35, relativeMinZ: 0.7, relativeMaxX: 0.65, relativeMaxZ: 0.85,
          activityTags: ['SOCIAL']
        },
        {
          roomType: 'SEATING',
          name: 'Lounge Tables',
          relativeMinX: 0.8, relativeMinZ: 0.25, relativeMaxX: 1.0, relativeMaxZ: 0.7,
          activityTags: ['SOCIAL', 'FOOD']
        },
        {
          roomType: 'VIP',
          name: 'VIP Skybox Lounge',
          relativeMinX: 0.2, relativeMinZ: 0.85, relativeMaxX: 0.8, relativeMaxZ: 1.0,
          activityTags: ['SOCIAL', 'SERVICES']
        },
        {
          roomType: 'BATHROOM',
          name: 'Restrooms',
          relativeMinX: 0.0, relativeMinZ: 0.7, relativeMaxX: 0.2, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'modern_neon_nightlife'
    });

    // 2. APARTMENT TEMPLATE
    this.templates.set('APARTMENT', {
      templateId: 'template_apartment',
      category: 'APARTMENT',
      defaultWidth: 16.0,
      defaultDepth: 14.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'ENTRY',
          name: 'Foyer',
          relativeMinX: 0.4, relativeMinZ: 0.0, relativeMaxX: 0.6, relativeMaxZ: 0.2,
          activityTags: ['RESIDENTIAL']
        },
        {
          roomType: 'LIVING_ROOM',
          name: 'Living Room',
          relativeMinX: 0.0, relativeMinZ: 0.2, relativeMaxX: 0.6, relativeMaxZ: 0.6,
          activityTags: ['RESIDENTIAL', 'SOCIAL']
        },
        {
          roomType: 'KITCHEN',
          name: 'Kitchen',
          relativeMinX: 0.6, relativeMinZ: 0.2, relativeMaxX: 1.0, relativeMaxZ: 0.6,
          activityTags: ['FOOD', 'RESIDENTIAL']
        },
        {
          roomType: 'BEDROOM',
          name: 'Master Bedroom',
          relativeMinX: 0.0, relativeMinZ: 0.6, relativeMaxX: 0.5, relativeMaxZ: 1.0,
          activityTags: ['RESIDENTIAL']
        },
        {
          roomType: 'BATHROOM',
          name: 'En-suite Bathroom',
          relativeMinX: 0.5, relativeMinZ: 0.6, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'modern_residential'
    });

    // 3. RETAIL / SMALL SHOP TEMPLATE
    this.templates.set('RETAIL', {
      templateId: 'template_retail',
      category: 'RETAIL',
      defaultWidth: 14.0,
      defaultDepth: 12.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'ENTRY',
          name: 'Shop Entrance',
          relativeMinX: 0.35, relativeMinZ: 0.0, relativeMaxX: 0.65, relativeMaxZ: 0.2,
          activityTags: ['SHOPPING']
        },
        {
          roomType: 'SHOP_FLOOR',
          name: 'Retail Display Floor',
          relativeMinX: 0.0, relativeMinZ: 0.2, relativeMaxX: 0.75, relativeMaxZ: 0.8,
          activityTags: ['SHOPPING']
        },
        {
          roomType: 'RECEPTION',
          name: 'Checkout Counter',
          relativeMinX: 0.75, relativeMinZ: 0.2, relativeMaxX: 1.0, relativeMaxZ: 0.6,
          activityTags: ['SHOPPING', 'SERVICES']
        },
        {
          roomType: 'STORAGE',
          name: 'Backroom Inventory',
          relativeMinX: 0.0, relativeMinZ: 0.8, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'nairobi_commercial_retail'
    });

    // 4. RESTAURANT TEMPLATE
    this.templates.set('RESTAURANT', {
      templateId: 'template_restaurant',
      category: 'RESTAURANT',
      defaultWidth: 18.0,
      defaultDepth: 16.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'ENTRY',
          name: 'Host Podium & Entrance',
          relativeMinX: 0.4, relativeMinZ: 0.0, relativeMaxX: 0.6, relativeMaxZ: 0.2,
          activityTags: ['FOOD', 'SERVICES']
        },
        {
          roomType: 'DINING',
          name: 'Main Dining Room',
          relativeMinX: 0.0, relativeMinZ: 0.2, relativeMaxX: 0.7, relativeMaxZ: 0.7,
          activityTags: ['FOOD', 'SOCIAL']
        },
        {
          roomType: 'BAR',
          name: 'Cocktail Bar',
          relativeMinX: 0.7, relativeMinZ: 0.2, relativeMaxX: 1.0, relativeMaxZ: 0.6,
          activityTags: ['FOOD', 'SOCIAL']
        },
        {
          roomType: 'KITCHEN',
          name: 'Commercial Kitchen',
          relativeMinX: 0.0, relativeMinZ: 0.7, relativeMaxX: 0.7, relativeMaxZ: 1.0,
          activityTags: ['FOOD']
        },
        {
          roomType: 'BATHROOM',
          name: 'Restrooms',
          relativeMinX: 0.7, relativeMinZ: 0.6, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'nairobi_eatery'
    });

    // 5. OFFICE TEMPLATE
    this.templates.set('OFFICE', {
      templateId: 'template_office',
      category: 'OFFICE',
      defaultWidth: 20.0,
      defaultDepth: 18.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'RECEPTION',
          name: 'Corporate Reception Lobby',
          relativeMinX: 0.3, relativeMinZ: 0.0, relativeMaxX: 0.7, relativeMaxZ: 0.25,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'OFFICE',
          name: 'Open Workspace',
          relativeMinX: 0.0, relativeMinZ: 0.25, relativeMaxX: 0.7, relativeMaxZ: 0.75,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'CORRIDOR',
          name: 'Executive Corridor',
          relativeMinX: 0.7, relativeMinZ: 0.25, relativeMaxX: 1.0, relativeMaxZ: 0.5,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'OFFICE',
          name: 'Executive Boardroom',
          relativeMinX: 0.7, relativeMinZ: 0.5, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'corporate_office'
    });

    // 6. GYM TEMPLATE
    this.templates.set('GYM', {
      templateId: 'template_gym',
      category: 'GYM',
      defaultWidth: 18.0,
      defaultDepth: 16.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'RECEPTION',
          name: 'Gym Front Desk',
          relativeMinX: 0.35, relativeMinZ: 0.0, relativeMaxX: 0.65, relativeMaxZ: 0.2,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'GYM_FLOOR',
          name: 'Main Weight & Cardio Area',
          relativeMinX: 0.0, relativeMinZ: 0.2, relativeMaxX: 0.8, relativeMaxZ: 0.8,
          activityTags: ['SOCIAL', 'SERVICES']
        },
        {
          roomType: 'BATHROOM',
          name: 'Locker Room & Showers',
          relativeMinX: 0.8, relativeMinZ: 0.2, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'fitness_center'
    });

    // 7. WAREHOUSE TEMPLATE
    this.templates.set('WAREHOUSE', {
      templateId: 'template_warehouse',
      category: 'WAREHOUSE',
      defaultWidth: 26.0,
      defaultDepth: 22.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'ENTRY',
          name: 'Loading Bay Entrance',
          relativeMinX: 0.35, relativeMinZ: 0.0, relativeMaxX: 0.65, relativeMaxZ: 0.2,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'WAREHOUSE',
          name: 'Main Pallet Storage Floor',
          relativeMinX: 0.0, relativeMinZ: 0.2, relativeMaxX: 1.0, relativeMaxZ: 0.85,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'OFFICE',
          name: 'Logistics Manager Office',
          relativeMinX: 0.7, relativeMinZ: 0.85, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'industrial_warehouse'
    });

    // 8. GARAGE / WORKSHOP TEMPLATE
    this.templates.set('GARAGE', {
      templateId: 'template_garage',
      category: 'GARAGE',
      defaultWidth: 20.0,
      defaultDepth: 16.0,
      floors: 1,
      roomSpecs: [
        {
          roomType: 'GARAGE',
          name: 'Service Bay 1 & 2',
          relativeMinX: 0.0, relativeMinZ: 0.0, relativeMaxX: 0.7, relativeMaxZ: 0.75,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'WORKSHOP',
          name: 'Parts & Machine Shop',
          relativeMinX: 0.7, relativeMinZ: 0.0, relativeMaxX: 1.0, relativeMaxZ: 0.75,
          activityTags: ['SERVICES']
        },
        {
          roomType: 'RECEPTION',
          name: 'Customer Waiting Area',
          relativeMinX: 0.0, relativeMinZ: 0.75, relativeMaxX: 1.0, relativeMaxZ: 1.0,
          activityTags: ['SERVICES']
        }
      ],
      entranceCount: 1,
      style: 'auto_workshop'
    });

    // Fallback template maps to RESIDENTIAL / APARTMENT / RETAIL
  }

  public static getTemplate(category: BuildingClassification): InteriorTemplateConfig {
    this.initialize();

    if (this.templates.has(category)) {
      return this.templates.get(category)!;
    }

    // Default fallback
    if (category === 'RESIDENTIAL') {
      return this.templates.get('APARTMENT')!;
    }
    if (category === 'HOTEL' || category === 'COMMUNITY' || category === 'MIXED_USE') {
      return this.templates.get('RESTAURANT')!;
    }

    return this.templates.get('RETAIL')!;
  }
}
