import { useParams } from "react-router-dom";
import { PolicialForm } from "@/components/sigo/PolicialForm";

export default function EditarPolicialPage() {
  const { id } = useParams<{ id: string }>();
  return <PolicialForm policialId={id ? parseInt(id) : undefined} />;
}
