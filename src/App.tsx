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
  ]
const classAlls: string[] = ["A", "B"];

const heightSlot = 40;
const heightDay = 20;
const gapClass = majorScale(1);

// 

const slotPositions: [string, number[][]][] =
  slotSettings.map(([day, slotNums]) => 
    [day, slotNums.map(n => Array.from({ length: n }, (_, i) => i + 1))]
  );

const MainContent: React.FC = () => {
  const Day: React.FC<{slotPositionDay: [string, number[][]]}> = ({slotPositionDay}) => {
    const [day, pss] = slotPositionDay;
    return (
      <Pane
        display="flex"
        flexDirection="column"
        gap={gapClass}
        background='tint2'
        padding={majorScale(2)}
        borderRadius={8}
      >
        <Card
          height={heightDay}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Heading textAlign="center">{day}</Heading>
        </Card>
        { classAlls.map(cls => (
          <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
            { pss.map(ps => (
              <Pane display="flex" flexDirection="row">
                { ps.map(p => (
                  <Slot label={`item${p}`} />
                ))}
              </Pane>
            ))}
          </Pane>
        ))}
      </Pane>
    );
  }

  return (
    <Pane
      flex={1}
      overflowY="auto"
      overflowX="auto"
      padding={majorScale(2)}
      display="flex"
      flexDirection="row"
      gap={majorScale(1)}
    >
      <Pane
        display="flex"
        flexDirection="column"
        gap={gapClass}
        padding={majorScale(2)}
      >
        <Card height={heightDay}>
          <Heading>　</Heading>
        </Card>
        { classAlls.map(cls => (
              <Card
                key={cls}
                height={heightSlot}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Heading textAlign="center">{cls}</Heading>
              </Card>
        ))}
      </Pane>

      { slotPositions.map(slotPositionDay => (
        <Day key={slotPositionDay[0]} slotPositionDay={slotPositionDay} />
      ))}
    </Pane>
  );
}

const Slot: React.FC<{ label: string }> = ({ label }) => (
  <Card elevation={1} padding={majorScale(1)} width={100} height={heightSlot}>
    <Paragraph textAlign="center">{label}</Paragraph>
  </Card>
);

const App: React.FC = () => {
  return (
    <Pane display="flex" flexDirection="column" height="100vh">
      {/* Top Pane/Header */}
      <Pane
        background="tint1"
        padding={16}
        elevation={1}
        display="flex"
        alignItems="center"
      >
        <Heading size={600}>Top Pane</Heading>
      </Pane>

      {/* Sidebar + Content */}
      <Pane display="flex" flex={1} minHeight={0}>
        {/* Sidebar */}
        <Pane
          background="tint1"
          display="flex"
          flexDirection="column"
          padding={majorScale(2)}
          elevation={1}
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