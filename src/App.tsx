import React, { useState } from 'react'
import
  { Pane
  , Card
  , Heading
  , Paragraph
  , majorScale
  } from 'evergreen-ui'

const slotSettings: [string, number[]][] =
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
  , ["Tue",
      [ 2
      , 1
      ]
    ]
  , ["Tue",
      [ 2
      , 1
      ]
    ]
  , ["Tue",
      [ 2
      , 1
      ]
    ]
  ]
const classAlls: string[] = ["A", "B"];

const widthSlot = 100;
const widthClass = 70;

const MainContent: React.FC = () => {
  const Day: React.FC<{slotDays: number[]}> = ({ slotDays }) => {
    return (
      <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
        { slotDays.map(l => (
          <Pane display="flex" flexDirection="row">
            { Array.from({ length: l }, (_, i) => i + 1).map(i => (
              <Slot label={`item${i}`} />
            ))}
          </Pane>
        ))}
      </Pane>
    );
  }
  const Class: React.FC<{ cls: string }> = ({ cls }) => {
    return (
      <Pane display="flex" flexDirection="row" gap={majorScale(3)}>
        <Card paddingTop={10} width={widthClass} style={{textAlign: 'center'}}>
          <Heading>{cls}</Heading>
        </Card>
        { slotSettings.map(slotSetting => (
          <Day slotDays={slotSetting[1]!} />
        ))}
      </Pane>
    );
  }
  return (
    <Pane flex={1} overflowY="auto" overflowX="auto" padding={24} display="flex" flexDirection="column" gap={majorScale(2)}>
      <Pane display="flex" flexDirection="row" gap={majorScale(3)}>
        <Card width={widthClass}>
          <Heading>　</Heading>
        </Card>
        { slotSettings.map(slotSetting => (
          <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
            <Pane display="flex" flexDirection="row">
              <Card width={widthSlot} style={{ textAlign: 'right' }}>
                {slotSetting[0]}
              </Card>
              {slotSetting[1].map((count, idx) =>
                Array.from({ length: count }, (_, i) => (
                  <Card key={`slot-header-${slotSetting[0]}-${idx}-${i}`} width={widthSlot} />
                ))
              )}
            </Pane>
          </Pane>
        ))}
      </Pane>
      { classAlls.map(cls => (
        <Class cls={cls} />
      ))}
    </Pane>
  );
}

const Slot: React.FC<{ label: string }> = ({ label }) => (
  <Card elevation={1} padding={majorScale(1)} width={widthSlot}>
    <Paragraph>{label}</Paragraph>
  </Card>
);

const App: React.FC = () => {

  return (
    <Pane display="flex" flexDirection="column" height="100vh">
      {/* Top Pane/Header */}
      <Pane
        background="tint2"
        padding={16}
        elevation={1}
        display="flex"
        alignItems="center"
      >
        <Heading size={600}>Top Pane</Heading>
      </Pane>
      {/* Main Area: Sidebar + Content */}
      <Pane display="flex" flex={1} minHeight={0}>
        {/* Sidebar */}
        <Pane
          width={200}
          background="tint1"
          display="flex"
          flexDirection="column"
          padding={majorScale(3)}
          elevation={0}
          overflowY="auto"
          minHeight={0}
          gap={majorScale(4)}
        >
          <Heading size={500} marginBottom={majorScale(2)}>Sidebar</Heading>
            <Slot label="item7" />
            <Slot label="item8" />
        </Pane>
        <MainContent />
      </Pane>
    </Pane>
  )
}

export default App