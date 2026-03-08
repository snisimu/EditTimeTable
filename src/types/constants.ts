import
  { majorScale
  , minorScale
  } from 'evergreen-ui'

export const slotSettings: [string, number[]][] =
  [ ["Mon",
      [ 2
      , 1
      ]
    ]
  , ["Tue",
      [ 2
      , 1
      ]
    ]
  , ["Wed",
      [ 2
      , 1
      ]
    ]
  , ["Thu",
      [ 2
      , 1
      ]
    ]
  , ["Fri",
      [ 2
      , 1
      ]
    ]
  ]

export const classAlls: [string, string[]][][] =
  [ [ ["1",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    , ["2",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    ]
  , [ ["3",
        [ "A"
        , "B"
        , "C"
        ]
      ]
    ]
  , [ ["4",
        [ "A"
        , "B"
        , "C"
        , "D"
        , "E"
        , "F"
        , "G"
        , "H"
        , "I"
        , "J"
        , "K"
        , "L"
        , "M"
        , "N"
        , "O"
        , "P"
        , "Q"
        , "R"
        , "S"
        , "T"
        ]
      ]
    ]
  ]

export const heightSlot = 40;
export const widthSlot = 80;
export const heightDay = 30;
export const widthGroupHeader = 30;
export const widthClassHeader = 40;
export const widthBlockGap = minorScale(1); // AM/PM（ブロック間）の gap 幅
export const widthDayGap = majorScale(1); // 曜日間の gap 幅

export const colors = {
  // Background
  background: "#F5F7FA",   // 極薄ブルーグレー
  surface:    "#FFFFFF",
  surfaceAlt: "#F1F5F9",

  // Borders
  border:     "#E2E8F0",

  // Text
  textMain:   "#0F172A",
  textSub:    "#475569",

  // Primary
  primary:    "#1E3A8A",    // 深いネイビー
  primaryHover:"#1D4ED8",
  primarySoft: "#DBEAFE",

  // Semantic
  success:    "#166534",
  warning:    "#B45309",
  danger:     "#B91C1C"
}
