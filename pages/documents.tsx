import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { http } from "../lib/modules/http/axios";

export default function Todos() {
  // Access the client
  const queryClient = useQueryClient();

  // Queries
  const query = useQuery({
    queryKey: ["documents"],
    queryFn: () => http.get("/documents"),
  });

  // // Mutations
  // const mutation = useMutation({
  //   mutationFn: postTodo,
  //   onSuccess: () => {
  //     // Invalidate and refetch
  //     queryClient.invalidateQueries({ queryKey: ["todos"] });
  //   },
  // });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {query.isLoading ? (
        <h1 style={{ display: "flex" }}>...loading</h1>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {query.data?.results?.map((doc) => (
            <li key={doc.id}>
              <p
                style={{
                  display: "flex",
                  width: "20rem",
                  gap: "1rem",
                }}
              >
                <span>{doc.file_latest.filename}</span>
                <span> - </span>
                <span>{doc.document_type.label}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* <button
      // onClick={() => {
      //   mutation.mutate({
      //     id: Date.now(),
      //     title: "Do Laundry",
      //   });
      // }}
      >
        Add Document
      </button> */}
    </div>
  );
}
