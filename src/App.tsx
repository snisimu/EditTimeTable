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
          overflowY="auto"
          minHeight={0}
        >
          <Heading size={500} marginBottom={majorScale(2)}>Sidebar</Heading>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
            <Card padding={majorScale(3)} background="yellowTint">content</Card>
        </Pane>
        {/* Main Content */}
        <Pane flex={1} overflowY="auto" overflowX="auto" padding={24}>
          {/* Main content goes here */}
          <Card elevation={1} padding={majorScale(1)} width={100}>
            <Heading>X</Heading>
            <Paragraph>Y</Paragraph>
          </Card>
        </Pane>
      </Pane>
    </Pane>
  )
}

export default App