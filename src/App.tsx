// Reusable item card component
const Item: React.FC<{ label: string }> = ({ label }) => (
  <Card elevation={1} padding={majorScale(1)} width={100}>
    <Paragraph>{label}</Paragraph>
  </Card>
);
import React, { useState } from 'react'
import
  { Pane
  , Button
  , Card
  , Heading
  , Paragraph
  , TextInput
  , Alert
  , majorScale
  , minorScale
  } from 'evergreen-ui'

const App: React.FC = () => {
  const [name, setName] = useState('')
  const [showAlert, setShowAlert] = useState(false)

  const handleSubmit = () => {
    if (name.trim()) {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }
  }

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
            <Item label="item4" />
            <Item label="item5" />
        </Pane>
        {/* Main Content */}
        <Pane flex={1} overflowY="auto" overflowX="auto" padding={24}>
          {/* Main content goes here */}
          <Pane display="flex" flexDirection="row" gap={majorScale(3)}>
            <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
              <Pane display="flex" flexDirection="row">
                <Item label="item1" />
                <Item label="item2" />
              </Pane>
              <Pane display="flex" flexDirection="row">
                <Item label="item1" />
              </Pane>
            </Pane>
            <Pane display="flex" flexDirection="row" gap={majorScale(1)}>
              <Pane display="flex" flexDirection="row">
                <Item label="item1" />
                <Item label="item2" />
              </Pane>
              <Pane display="flex" flexDirection="row">
                <Item label="item1" />
              </Pane>
            </Pane>
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  )
}

export default App