// Web port of mobile ResultScreen.tsx
import ResultView from '../../components/ResultView';

export default function Result() {
  return (
    <ResultView
      title="Results"
      generatingText="Generating images"
      doneText="All images generated"
      showTryAnother
    />
  );
}
