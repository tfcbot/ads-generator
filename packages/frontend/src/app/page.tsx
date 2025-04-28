import { ResearchForm } from '../components/ResearchForm';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-fg-primary">Research Anything</h1>
      </div>
      
      <ResearchForm />
    </div>
  );
}
