import React, { useState } from 'react'
import { 
  Pane, 
  Button, 
  Card, 
  Heading, 
  Paragraph, 
  TextInput,
  Alert,
  majorScale 
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
          width={240}
          background="tint1"
          display="flex"
          flexDirection="column"
          padding={16}
          elevation={0}
        >
          <Heading size={500} marginBottom={majorScale(2)}>Sidebar</Heading>
          <Button marginBottom={majorScale(1)}>Menu 1</Button>
          <Button marginBottom={majorScale(1)}>Menu 2</Button>
          <Button>Menu 3</Button>
        </Pane>
        {/* Main Content */}
        <Pane flex={1} overflowY="auto" overflowX="auto" padding={24}>
          {/* Main content goes here */}
          <Card elevation={1} padding={majorScale(3)} minWidth={600} minHeight={400}>
            <Heading size={400} marginBottom={majorScale(2)}>Welcome!</Heading>
            <Paragraph marginBottom={majorScale(2)}>
              This is the main content area. Add more content here to test horizontal and vertical scrolling.
            </Paragraph>
            <TextInput
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              marginBottom={majorScale(2)}
            />
            <Button appearance="primary" onClick={handleSubmit}>Submit</Button>
            {showAlert && (
              <Alert intent="success" marginTop={majorScale(2)}>
                Hello, {name}!
              </Alert>
            )}
            {/* Example wide content for horizontal scroll */}
            <Pane marginTop={majorScale(2)} width={1200} height={200} background="tint2" display="flex" alignItems="center" justifyContent="center">
              <Heading size={300}>This is a wide content area to demonstrate horizontal scrolling.</Heading>
            </Pane>
            {/* Example tall content for vertical scroll */}
            <Pane marginTop={majorScale(2)} height={600} background="tint1" display="flex" alignItems="center" justifyContent="center">
              <Heading size={300}>This is a tall content area to demonstrate vertical scrolling.</Heading>
            </Pane>
          </Card>
        </Pane>
      </Pane>
    </Pane>
  )
}

export default App