"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";

interface Prediction {
  id: string;
  status: string;
  output?: string[];
  detail?: string;
  error?: string;
}

async function createPrediction(prompt: string): Promise<Prediction> {
  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const prediction = await response.json();
  if (response.status !== 201) {
    throw new Error(prediction.detail ?? "Something went wrong");
  }
  return prediction;
}

async function fetchPrediction(id: string): Promise<Prediction> {
  const response = await fetch(`/api/predictions/${id}`);
  const prediction = await response.json();
  if (response.status !== 200) {
    throw new Error(prediction.detail ?? "Something went wrong");
  }
  return prediction;
}

export default function Home() {
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    promptInputRef.current?.focus();
  }, []);

  const mutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: (data) => setPredictionId(data.id),
  });

  const { data: prediction } = useQuery({
    queryKey: ["prediction", predictionId],
    queryFn: () => fetchPrediction(predictionId!),
    enabled: !!predictionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "succeeded" || status === "failed" ? false : 250;
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;
    mutation.mutate(prompt);
  };

  const error = mutation.error?.message ?? (prediction?.status === "failed" ? prediction.error : null);

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <h1 className="py-6 text-center font-bold text-2xl">
        Dream something with{" "}
        <a href="https://replicate.com/black-forest-labs/flux-2-klein-9b?utm_source=project&utm_project=getting-started">
          FLUX.2 [klein]
        </a>
      </h1>

      <form className="w-full flex" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow"
          name="prompt"
          placeholder="Enter a prompt to display an image"
          ref={promptInputRef}
        />
        <button className="button" type="submit">
          Go!
        </button>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <>
          {prediction.output && (
            <div className="image-wrapper mt-5">
              <Image
                fill
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                sizes="100vw"
              />
            </div>
          )}
          <p className="py-3 text-sm opacity-50">
            status: {prediction.status}
          </p>
        </>
      )}
    </div>
  );
}
