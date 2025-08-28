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
    <Pane
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      background="tint1"
    >
      <Card
        backgroundColor="white"
        elevation={2}
        padding={majorScale(4)}
        width={400}
      >
        <Pane marginBottom={majorScale(3)}>
          <Heading size={600} marginBottom={majorScale(2)}>
            Welcome to Evergreen UI
          </Heading>
          <Paragraph color="muted">
            This is a minimum TypeScript React app using Evergreen UI components.
          </Paragraph>
        </Pane>

        <Pane marginBottom={majorScale(3)}>
          <TextInput
            placeholder="Enter your name..."
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            width="100%"
            marginBottom={majorScale(2)}
          />
          <Button
            appearance="primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
            width="100%"
          >
            Say Hello
          </Button>
        </Pane>

        {showAlert && (
          <Alert
            intent="success"
            title={`Hello, ${name}!`}
            marginBottom={majorScale(2)}
          >
            Welcome to the Evergreen UI world!
          </Alert>
        )}
      </Card>
    </Pane>
  )
}

export default App