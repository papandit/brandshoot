// Web port of mobile BrandingResultScreen.tsx
import ResultView from '../../components/ResultView';

export default function BrandingResult() {
  return (
    <ResultView
      title="Branding Results"
      generatingText="Generating"
      doneText="All branded images generated!"
      showTryAnother
    />
  );
}
