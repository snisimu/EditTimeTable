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

const MainContent: React.FC = () => {
  const Day: React.FC = () => {
    return (
      <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
        <Pane display="flex" flexDirection="row">
          <Slot label="item1" />
          <Slot label="item2" />
        </Pane>
        <Pane display="flex" flexDirection="row">
          <Slot label="item3" />
        </Pane>
      </Pane>
    );
  }
  const Class: React.FC = () => {
    return (
      <Pane display="flex" flexDirection="row" gap={majorScale(3)}>
        <Day />
        <Day />
      </Pane>
    );
  }
  return (
    <Pane flex={1} overflowY="auto" overflowX="auto" padding={24} display="flex" flexDirection="column" gap={majorScale(2)}>
        <Class />
        <Class />
    </Pane>
  );
}

const Slot: React.FC<{ label: string }> = ({ label }) => (
  <Card elevation={1} padding={majorScale(1)} width={100}>
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