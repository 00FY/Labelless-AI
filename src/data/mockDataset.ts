import { DatasetItem, ActiveLearningRound, ProjectConfig } from '../types';
import { COMPARISON_METRICS } from './realMetrics';

export const CLASS_COLORS: Record<string, { border: string; bg: string; text: string; hex: string }> = {
  'Damaged Building': {
    border: 'border-rose-500',
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    hex: '#F43F5E',
  },
  'Undamaged Building': {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    hex: '#10B981',
  },
  Fire: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    hex: '#F59E0B',
  },
  Smoke: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    hex: '#A855F7',
  },
};

export const PIPELINE_STREAM_SAMPLES = [
  {
    id: '#5789',
    name: 'Wildfire Plume',
    class: 'Fire',
    conf: 0.99,
    status: 'auto_labeled',
    statusText: 'AUTO-LABELLED',
    reason: 'High confidence (99% > 85%) + Distinct fire signature',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    icon: '✓',
  },
  {
    id: '#09E6',
    name: 'Damaged Structural Complex',
    class: 'Damaged Building',
    conf: 0.73,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Low confidence (73%) + Structural entropy',
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    icon: '⚠',
  },
  {
    id: '#00F2',
    name: 'Intact Residential Block',
    class: 'Undamaged Building',
    conf: 0.88,
    status: 'auto_labeled',
    statusText: 'AUTO-LABELLED',
    reason: 'High confidence (88%) + Standard geometry',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    icon: '✓',
  },
  {
    id: '#2A78',
    name: 'Dense Chemical Smoke',
    class: 'Smoke',
    conf: 0.51,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Rare class (Smoke < 5%) + High entropy boundary',
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    icon: '⚠',
  },
  {
    id: '#03DB',
    name: 'Mixed Rubble Field',
    class: 'Damaged Building',
    conf: 0.50,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Overlapping bounding box candidates',
    color: 'border-amber-500 text-amber-400 bg-amber-500/10',
    icon: '⚠',
  },
];

export const INITIAL_PROJECT_CONFIG: ProjectConfig = {
  projectName: 'DisasterVision YOLOv8',
  datasetName: 'Multi-Disaster Active Learning Dataset',
  modelType: 'YOLOv8',
  modelVersion: 'v2.3 Fine-Tuned',
  strategy: 'balanced',
  confidenceThreshold: 0.85,
  uncertaintyWeight: 0.4,
  diversityWeight: 0.3,
  rareClassWeight: 0.3,
  classes: ['Damaged Building', 'Undamaged Building', 'Fire', 'Smoke'],
  pipelineStatus: 'round_complete',
  currentRound: 4,
};

export const INITIAL_DATASET_ITEMS: DatasetItem[] = [
  {
    "id": "#0001",
    "title": "Damaged Building Sector #1",
    "filename": "00f205aea57febc8e82d4e99a18b1d51.png",
    "imageUrl": "/predictions/09e62858a678e6fcea8bced21d03ab1c.png",
    "predictedClass": "Damaged Building",
    "confidence": 0.88,
    "uncertaintyScore": 0.12,
    "diversityScore": 0.4,
    "rareClassScore": 0.2,
    "priorityScore": 0.23,
    "priorityLevel": "low",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.05,
      "diversityContribution": 0.12,
      "rareClassContribution": 0.06,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 87%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.23 (LOW)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-0-0",
        "label": "Damaged Building",
        "x": 65.4,
        "y": 24.0,
        "width": 12.5,
        "height": 13.6,
        "confidence": 0.88
      },
      {
        "id": "b-0-1",
        "label": "Damaged Building",
        "x": 31.0,
        "y": 26.2,
        "width": 13.3,
        "height": 11.9,
        "confidence": 0.86
      },
      {
        "id": "b-0-2",
        "label": "Damaged Building",
        "x": 43.0,
        "y": 62.7,
        "width": 10.0,
        "height": 11.8,
        "confidence": 0.86
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0002",
    "title": "Undamaged Building Sector #2",
    "filename": "026da06805cf6612f6ea894a49c19465.png",
    "imageUrl": "/predictions/multidisaster_sample_1.jpg",
    "predictedClass": "Undamaged Building",
    "confidence": 0.8,
    "uncertaintyScore": 0.2,
    "diversityScore": 0.51,
    "rareClassScore": 0.35,
    "priorityScore": 0.34,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (79% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.08,
      "diversityContribution": 0.15,
      "rareClassContribution": 0.1,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 79%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.34 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-1-0",
        "label": "Undamaged Building",
        "x": 59.3,
        "y": 48.0,
        "width": 13.3,
        "height": 16.7,
        "confidence": 0.8
      },
      {
        "id": "b-1-1",
        "label": "Undamaged Building",
        "x": 46.0,
        "y": 55.4,
        "width": 10.0,
        "height": 11.7,
        "confidence": 0.8
      },
      {
        "id": "b-1-2",
        "label": "Undamaged Building",
        "x": 12.0,
        "y": 65.2,
        "width": 11.9,
        "height": 14.5,
        "confidence": 0.77
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0003",
    "title": "Undamaged Building Sector #3",
    "filename": "02b8af9e694e9217c5df1812b1153ab8.png",
    "imageUrl": "/predictions/03db54200069482ff87cab702a6be150.png",
    "predictedClass": "Undamaged Building",
    "confidence": 0.77,
    "uncertaintyScore": 0.23,
    "diversityScore": 0.62,
    "rareClassScore": 0.5,
    "priorityScore": 0.43,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (76% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.09,
      "diversityContribution": 0.19,
      "rareClassContribution": 0.15,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 76%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.43 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-2-0",
        "label": "Undamaged Building",
        "x": 69.9,
        "y": 5.0,
        "width": 13.3,
        "height": 17.2,
        "confidence": 0.77
      },
      {
        "id": "b-2-1",
        "label": "Undamaged Building",
        "x": 59.6,
        "y": 5.0,
        "width": 10.9,
        "height": 16.5,
        "confidence": 0.73
      },
      {
        "id": "b-2-2",
        "label": "Undamaged Building",
        "x": 28.2,
        "y": 5.0,
        "width": 11.3,
        "height": 12.0,
        "confidence": 0.63
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0004",
    "title": "Damaged Building Sector #4",
    "filename": "02d76c270e3bd4c8a2cc3dfafba176c3.png",
    "imageUrl": "/predictions/0cc1d593cae6ffebfce45bf447fa6e69.png",
    "predictedClass": "Damaged Building",
    "confidence": 0.8,
    "uncertaintyScore": 0.2,
    "diversityScore": 0.73,
    "rareClassScore": 0.65,
    "priorityScore": 0.49,
    "priorityLevel": "medium",
    "reasons": [
      "Low confidence (79% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.08,
      "diversityContribution": 0.22,
      "rareClassContribution": 0.2,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 79%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.49 (MEDIUM)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-3-0",
        "label": "Damaged Building",
        "x": 68.3,
        "y": 55.9,
        "width": 16.2,
        "height": 14.5,
        "confidence": 0.8
      },
      {
        "id": "b-3-1",
        "label": "Damaged Building",
        "x": 85.0,
        "y": 85.0,
        "width": 11.0,
        "height": 10.0,
        "confidence": 0.56
      },
      {
        "id": "b-3-2",
        "label": "Damaged Building",
        "x": 71.5,
        "y": 5.0,
        "width": 13.5,
        "height": 10.0,
        "confidence": 0.48
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0005",
    "title": "Undamaged Building Sector #5",
    "filename": "03db54200069482ff87cab702a6be150.png",
    "imageUrl": "/predictions/0decc9d19b769d6d641eaba36653f802.png",
    "predictedClass": "Undamaged Building",
    "confidence": 0.82,
    "uncertaintyScore": 0.18,
    "diversityScore": 0.84,
    "rareClassScore": 0.2,
    "priorityScore": 0.38,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (82% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.07,
      "diversityContribution": 0.25,
      "rareClassContribution": 0.06,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 82%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.38 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-4-0",
        "label": "Undamaged Building",
        "x": 85.0,
        "y": 26.5,
        "width": 14.9,
        "height": 26.7,
        "confidence": 0.82
      },
      {
        "id": "b-4-1",
        "label": "Undamaged Building",
        "x": 40.8,
        "y": 77.0,
        "width": 23.1,
        "height": 23.0,
        "confidence": 0.59
      },
      {
        "id": "b-4-2",
        "label": "Undamaged Building",
        "x": 11.3,
        "y": 81.0,
        "width": 11.9,
        "height": 10.0,
        "confidence": 0.53
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0006",
    "title": "Undamaged Building Sector #6",
    "filename": "04ec74dcc27fa805a501fa352a059b50.png",
    "imageUrl": "/predictions/00f205aea57febc8e82d4e99a18b1d51.png",
    "predictedClass": "Undamaged Building",
    "confidence": 0.87,
    "uncertaintyScore": 0.13,
    "diversityScore": 0.4,
    "rareClassScore": 0.35,
    "priorityScore": 0.28,
    "priorityLevel": "low",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.05,
      "diversityContribution": 0.12,
      "rareClassContribution": 0.1,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 86%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.28 (LOW)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-5-0",
        "label": "Undamaged Building",
        "x": 18.9,
        "y": 5.0,
        "width": 10.9,
        "height": 11.6,
        "confidence": 0.87
      },
      {
        "id": "b-5-1",
        "label": "Undamaged Building",
        "x": 68.6,
        "y": 5.0,
        "width": 11.3,
        "height": 11.0,
        "confidence": 0.7
      },
      {
        "id": "b-5-2",
        "label": "Undamaged Building",
        "x": 33.4,
        "y": 10.4,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.67
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0007",
    "title": "Undamaged Building Sector #7",
    "filename": "0546c42ec775d0dba3b6f7bd2beeed2d.png",
    "imageUrl": "/predictions/multidisaster_sample_2.jpg",
    "predictedClass": "Undamaged Building",
    "confidence": 0.81,
    "uncertaintyScore": 0.19,
    "diversityScore": 0.51,
    "rareClassScore": 0.5,
    "priorityScore": 0.38,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (80% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.08,
      "diversityContribution": 0.15,
      "rareClassContribution": 0.15,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 80%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.38 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-6-0",
        "label": "Undamaged Building",
        "x": 85.0,
        "y": 84.4,
        "width": 10.0,
        "height": 11.9,
        "confidence": 0.81
      },
      {
        "id": "b-6-1",
        "label": "Undamaged Building",
        "x": 72.1,
        "y": 79.1,
        "width": 10.8,
        "height": 13.8,
        "confidence": 0.77
      },
      {
        "id": "b-6-2",
        "label": "Undamaged Building",
        "x": 82.0,
        "y": 82.7,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.57
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0008",
    "title": "Damaged Building Sector #8",
    "filename": "05cb25ff2685a29d0c7eafb3172015ce.png",
    "imageUrl": "/predictions/10320cb5d267aebe2e10727a211d859b.png",
    "predictedClass": "Damaged Building",
    "confidence": 0.89,
    "uncertaintyScore": 0.11,
    "diversityScore": 0.62,
    "rareClassScore": 0.65,
    "priorityScore": 0.43,
    "priorityLevel": "low",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.04,
      "diversityContribution": 0.19,
      "rareClassContribution": 0.2,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 89%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.43 (LOW)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-7-0",
        "label": "Damaged Building",
        "x": 41.4,
        "y": 75.9,
        "width": 12.0,
        "height": 13.8,
        "confidence": 0.89
      },
      {
        "id": "b-7-1",
        "label": "Damaged Building",
        "x": 49.1,
        "y": 85.0,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.82
      },
      {
        "id": "b-7-2",
        "label": "Damaged Building",
        "x": 35.5,
        "y": 72.3,
        "width": 12.0,
        "height": 12.4,
        "confidence": 0.81
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0009",
    "title": "Damaged Building Sector #9",
    "filename": "06262fa10c936c2c38a9a6c621565604.png",
    "imageUrl": "/predictions/multidisaster_sample_3.jpg",
    "predictedClass": "Damaged Building",
    "confidence": 0.29,
    "uncertaintyScore": 0.71,
    "diversityScore": 0.73,
    "rareClassScore": 0.2,
    "priorityScore": 0.56,
    "priorityLevel": "medium",
    "reasons": [
      "Low confidence (28% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.28,
      "diversityContribution": 0.22,
      "rareClassContribution": 0.06,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 28%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.56 (MEDIUM)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-8-0",
        "label": "Damaged Building",
        "x": 84.8,
        "y": 31.7,
        "width": 12.8,
        "height": 19.6,
        "confidence": 0.29
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#000A",
    "title": "Undamaged Building Sector #10",
    "filename": "06a18166c8062181c64920a7d4079c7b.png",
    "imageUrl": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop",
    "predictedClass": "Undamaged Building",
    "confidence": 0.61,
    "uncertaintyScore": 0.39,
    "diversityScore": 0.84,
    "rareClassScore": 0.35,
    "priorityScore": 0.51,
    "priorityLevel": "medium",
    "reasons": [
      "Low confidence (60% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.16,
      "diversityContribution": 0.25,
      "rareClassContribution": 0.1,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 60%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.51 (MEDIUM)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-9-0",
        "label": "Undamaged Building",
        "x": 36.5,
        "y": 69.2,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.61
      },
      {
        "id": "b-9-1",
        "label": "Damaged Building",
        "x": 57.9,
        "y": 40.9,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.59
      },
      {
        "id": "b-9-2",
        "label": "Undamaged Building",
        "x": 5.0,
        "y": 8.5,
        "width": 11.1,
        "height": 13.1,
        "confidence": 0.51
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#000B",
    "title": "Damaged Building Sector #11",
    "filename": "06f923fd6648f59b444c2188fbe0ef88.png",
    "imageUrl": "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=600&auto=format&fit=crop",
    "predictedClass": "Damaged Building",
    "confidence": 0.9,
    "uncertaintyScore": 0.1,
    "diversityScore": 0.4,
    "rareClassScore": 0.5,
    "priorityScore": 0.31,
    "priorityLevel": "low",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.04,
      "diversityContribution": 0.12,
      "rareClassContribution": 0.15,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 90%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.31 (LOW)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-10-0",
        "label": "Damaged Building",
        "x": 60.3,
        "y": 77.4,
        "width": 13.1,
        "height": 12.1,
        "confidence": 0.9
      },
      {
        "id": "b-10-1",
        "label": "Damaged Building",
        "x": 42.1,
        "y": 63.2,
        "width": 10.0,
        "height": 11.4,
        "confidence": 0.9
      },
      {
        "id": "b-10-2",
        "label": "Damaged Building",
        "x": 47.2,
        "y": 66.7,
        "width": 11.9,
        "height": 12.7,
        "confidence": 0.89
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#000C",
    "title": "Undamaged Building Sector #12",
    "filename": "07985a5a543c820736007f857717ded2.png",
    "imageUrl": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop",
    "predictedClass": "Undamaged Building",
    "confidence": 0.8,
    "uncertaintyScore": 0.2,
    "diversityScore": 0.51,
    "rareClassScore": 0.65,
    "priorityScore": 0.43,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (80% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.08,
      "diversityContribution": 0.15,
      "rareClassContribution": 0.2,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 80%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.43 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-11-0",
        "label": "Undamaged Building",
        "x": 14.1,
        "y": 36.9,
        "width": 11.5,
        "height": 14.1,
        "confidence": 0.8
      },
      {
        "id": "b-11-1",
        "label": "Undamaged Building",
        "x": 26.3,
        "y": 16.5,
        "width": 12.4,
        "height": 10.0,
        "confidence": 0.3
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#000D",
    "title": "Undamaged Building Sector #13",
    "filename": "09e62858a678e6fcea8bced21d03ab1c.png",
    "imageUrl": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop",
    "predictedClass": "Undamaged Building",
    "confidence": 0.85,
    "uncertaintyScore": 0.15,
    "diversityScore": 0.62,
    "rareClassScore": 0.2,
    "priorityScore": 0.31,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (84% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.06,
      "diversityContribution": 0.19,
      "rareClassContribution": 0.06,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 84%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.31 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-12-0",
        "label": "Undamaged Building",
        "x": 38.9,
        "y": 66.3,
        "width": 15.0,
        "height": 17.2,
        "confidence": 0.85
      },
      {
        "id": "b-12-1",
        "label": "Damaged Building",
        "x": 52.1,
        "y": 62.1,
        "width": 12.6,
        "height": 12.2,
        "confidence": 0.73
      },
      {
        "id": "b-12-2",
        "label": "Damaged Building",
        "x": 65.9,
        "y": 40.0,
        "width": 10.0,
        "height": 11.9,
        "confidence": 0.72
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#000E",
    "title": "Damaged Building Sector #14",
    "filename": "0a7105c3b056fd88e3209f5aa70afc4c.png",
    "imageUrl": "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&auto=format&fit=crop",
    "predictedClass": "Damaged Building",
    "confidence": 0.79,
    "uncertaintyScore": 0.21,
    "diversityScore": 0.73,
    "rareClassScore": 0.35,
    "priorityScore": 0.41,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (78% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.08,
      "diversityContribution": 0.22,
      "rareClassContribution": 0.1,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 78%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.41 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-13-0",
        "label": "Damaged Building",
        "x": 12.6,
        "y": 79.1,
        "width": 12.5,
        "height": 11.6,
        "confidence": 0.79
      },
      {
        "id": "b-13-1",
        "label": "Undamaged Building",
        "x": 60.9,
        "y": 29.1,
        "width": 12.1,
        "height": 10.7,
        "confidence": 0.69
      },
      {
        "id": "b-13-2",
        "label": "Undamaged Building",
        "x": 67.7,
        "y": 47.5,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.65
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0010",
    "title": "Undamaged Building Sector #16",
    "filename": "0cc1d593cae6ffebfce45bf447fa6e69.png",
    "imageUrl": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop",
    "predictedClass": "Undamaged Building",
    "confidence": 0.78,
    "uncertaintyScore": 0.22,
    "diversityScore": 0.4,
    "rareClassScore": 0.65,
    "priorityScore": 0.4,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (78% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.09,
      "diversityContribution": 0.12,
      "rareClassContribution": 0.2,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 78%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.4 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-15-0",
        "label": "Undamaged Building",
        "x": 30.6,
        "y": 27.9,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.78
      },
      {
        "id": "b-15-1",
        "label": "Undamaged Building",
        "x": 16.8,
        "y": 27.2,
        "width": 55.7,
        "height": 42.2,
        "confidence": 0.73
      },
      {
        "id": "b-15-2",
        "label": "Undamaged Building",
        "x": 12.7,
        "y": 80.4,
        "width": 16.0,
        "height": 15.2,
        "confidence": 0.73
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0011",
    "title": "Undamaged Building Sector #17",
    "filename": "0d8d1b6cf3afb4b8d8a9299a798d4014.png",
    "imageUrl": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop",
    "predictedClass": "Undamaged Building",
    "confidence": 0.99,
    "uncertaintyScore": 0.01,
    "diversityScore": 0.51,
    "rareClassScore": 0.2,
    "priorityScore": 0.22,
    "priorityLevel": "low",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.0,
      "diversityContribution": 0.15,
      "rareClassContribution": 0.06,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 98%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.22 (LOW)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-16-0",
        "label": "Undamaged Building",
        "x": 79.3,
        "y": 27.5,
        "width": 20.7,
        "height": 39.5,
        "confidence": 0.99
      },
      {
        "id": "b-16-1",
        "label": "Undamaged Building",
        "x": 5.0,
        "y": 29.8,
        "width": 60.0,
        "height": 30.1,
        "confidence": 0.98
      },
      {
        "id": "b-16-2",
        "label": "Undamaged Building",
        "x": 69.0,
        "y": 5.0,
        "width": 14.1,
        "height": 14.1,
        "confidence": 0.72
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0012",
    "title": "Damaged Building Sector #18",
    "filename": "0de8fab7755fc8365e6acedc3081d3ba.png",
    "imageUrl": "/predictions/09e62858a678e6fcea8bced21d03ab1c.png",
    "predictedClass": "Damaged Building",
    "confidence": 0.58,
    "uncertaintyScore": 0.42,
    "diversityScore": 0.62,
    "rareClassScore": 0.35,
    "priorityScore": 0.46,
    "priorityLevel": "medium",
    "reasons": [
      "Low confidence (57% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.17,
      "diversityContribution": 0.19,
      "rareClassContribution": 0.1,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 57%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.46 (MEDIUM)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-17-0",
        "label": "Damaged Building",
        "x": 39.9,
        "y": 5.0,
        "width": 13.0,
        "height": 10.0,
        "confidence": 0.58
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0013",
    "title": "Damaged Building Sector #19",
    "filename": "0decc9d19b769d6d641eaba36653f802.png",
    "imageUrl": "/predictions/multidisaster_sample_1.jpg",
    "predictedClass": "Damaged Building",
    "confidence": 0.83,
    "uncertaintyScore": 0.17,
    "diversityScore": 0.73,
    "rareClassScore": 0.5,
    "priorityScore": 0.44,
    "priorityLevel": "low",
    "reasons": [
      "Low confidence (82% < 85%)",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.07,
      "diversityContribution": 0.22,
      "rareClassContribution": 0.15,
      "recommendation": "Human review recommended",
      "bulletPoints": [
        "YOLOv8 confidence score is 82%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.44 (LOW)."
      ]
    },
    "status": "pending",
    "boxes": [
      {
        "id": "b-18-0",
        "label": "Damaged Building",
        "x": 51.1,
        "y": 36.8,
        "width": 12.1,
        "height": 15.5,
        "confidence": 0.83
      },
      {
        "id": "b-18-1",
        "label": "Undamaged Building",
        "x": 85.0,
        "y": 80.6,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.68
      },
      {
        "id": "b-18-2",
        "label": "Damaged Building",
        "x": 29.9,
        "y": 84.0,
        "width": 10.0,
        "height": 10.0,
        "confidence": 0.58
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  },
  {
    "id": "#0014",
    "title": "Damaged Building Sector #20",
    "filename": "0fb4fc4867bf8cd7ff23fbbd212886b5.png",
    "imageUrl": "/predictions/03db54200069482ff87cab702a6be150.png",
    "predictedClass": "Damaged Building",
    "confidence": 0.88,
    "uncertaintyScore": 0.12,
    "diversityScore": 0.84,
    "rareClassScore": 0.65,
    "priorityScore": 0.49,
    "priorityLevel": "medium",
    "reasons": [
      "High confidence auto-candidate",
      "Structural ambiguity",
      "High entropy embedding"
    ],
    "explanation": {
      "uncertaintyContribution": 0.05,
      "diversityContribution": 0.25,
      "rareClassContribution": 0.2,
      "recommendation": "Auto-labeled candidate",
      "bulletPoints": [
        "YOLOv8 confidence score is 87%.",
        "Extracted feature embedding has high distance in active selection pool.",
        "Priority score calculated at 0.49 (MEDIUM)."
      ]
    },
    "status": "auto_labeled",
    "boxes": [
      {
        "id": "b-19-0",
        "label": "Damaged Building",
        "x": 5.0,
        "y": 64.0,
        "width": 12.8,
        "height": 13.1,
        "confidence": 0.88
      },
      {
        "id": "b-19-1",
        "label": "Damaged Building",
        "x": 20.4,
        "y": 85.0,
        "width": 14.6,
        "height": 10.0,
        "confidence": 0.75
      },
      {
        "id": "b-19-2",
        "label": "Damaged Building",
        "x": 5.0,
        "y": 84.8,
        "width": 18.1,
        "height": 15.2,
        "confidence": 0.6
      }
    ],
    "estimatedManualSec": 35,
    "aiAssistedSec": 10,
    "createdAtRound": 4
  }
];

// Map real metrics into ActiveLearningRound format
const labellessMetrics = COMPARISON_METRICS.filter((m) => m.method === 'labelless');

export const ACTIVE_LEARNING_ROUNDS: ActiveLearningRound[] = labellessMetrics.map((m) => {
  const totalImgs = 1000;
  const humanReviewedCount = m.images_reviewed;
  const autoLabeledCount = Math.round(totalImgs * (1 - humanReviewedCount / totalImgs));
  const pendingCount = totalImgs - humanReviewedCount - autoLabeledCount;
  const randomEffortAtRound = 100 + m.round * 100;
  const effortSavedPct = parseFloat(
    (((randomEffortAtRound - humanReviewedCount) / randomEffortAtRound) * 100).toFixed(1)
  );

  return {
    round: m.round,
    name: m.round === 0 ? 'Round 0 (Seed Baseline)' : Round  ( reviewed),
    mAP50: parseFloat((m.mAP50 * 100).toFixed(1)),
    precision: parseFloat((m.precision * 100).toFixed(1)),
    recall: parseFloat((m.recall * 100).toFixed(1)),
    f1Score: parseFloat(
      (((2 * m.precision * m.recall) / (m.precision + m.recall)) * 100).toFixed(1)
    ),
    autoLabeledCount,
    humanReviewedCount,
    pendingCount: Math.max(0, pendingCount),
    humanEffortSavedPct: Math.max(0, effortSavedPct),
    trainingImages: humanReviewedCount,
    status: m.round === 4 ? 'current' : 'completed',
    classMetrics: [
      {
        className: 'Damaged Building',
        precision: Math.round(m.precision * 100 - 2),
        recall: Math.round(m.recall * 100 - 4),
        ap50: Math.round(m.mAP50 * 100 - 3),
        samples: Math.round(humanReviewedCount * 0.45),
        color: CLASS_COLORS['Damaged Building'] ? CLASS_COLORS['Damaged Building'].hex : '#F43F5E',
      },
      {
        className: 'Undamaged Building',
        precision: Math.round(m.precision * 100 + 4),
        recall: Math.round(m.recall * 100 + 2),
        ap50: Math.round(m.mAP50 * 100 + 3),
        samples: Math.round(humanReviewedCount * 0.38),
        color: CLASS_COLORS['Undamaged Building'] ? CLASS_COLORS['Undamaged Building'].hex : '#10B981',
      },
      {
        className: 'Fire',
        precision: Math.round(m.precision * 100 - 5),
        recall: Math.round(m.recall * 100 - 6),
        ap50: Math.round(m.mAP50 * 100 - 5),
        samples: Math.round(humanReviewedCount * 0.10),
        color: CLASS_COLORS['Fire'] ? CLASS_COLORS['Fire'].hex : '#F59E0B',
      },
      {
        className: 'Smoke',
        precision: Math.round(m.precision * 100 - 3),
        recall: Math.round(m.recall * 100 - 2),
        ap50: Math.round(m.mAP50 * 100 - 4),
        samples: Math.round(humanReviewedCount * 0.07),
        color: CLASS_COLORS['Smoke'] ? CLASS_COLORS['Smoke'].hex : '#A855F7',
      },
    ],
  };
});
