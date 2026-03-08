import { Paragraph } from 'evergreen-ui'

export const SubjectCardView: React.FC<{
  text: string;
  color?: string;
}> = ({
  text,
  color,
}) => {
  return (
    <Paragraph textAlign="center" fontSize="small" color={color}>
      {text}
    </Paragraph>
  );
};
