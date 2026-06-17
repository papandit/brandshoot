// Web port of mobile CatalogueResultScreen.tsx
import ResultView from '../../components/ResultView';

export default function CatalogueResult() {
  return (
    <ResultView
      title="Catalogue Results"
      generatingText="Generating catalogue images"
      doneText="All images generated!"
    />
  );
}
