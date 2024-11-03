import { observer } from "mobx-react-lite";
import {
  Button,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { FaTrashAlt } from "react-icons/fa";
import { Experience } from "@/src/types/Experience";

export const ExperiencesTable = observer(function ExperiencesTable({
  experiencesAndUsers,
  onLoadExperience,
  selectable,
  selectedExperiences,
  setSelectedExperiences,
}: {
  experiencesAndUsers: { user: { username: string }; experience: Experience }[];
  onLoadExperience: (experience: Experience) => void;
  // TODO: implement selectable experiences in the table
  selectable?: boolean;
  selectedExperiences?: string[];
  setSelectedExperiences?: (experiences: string[]) => void;
}) {
  const store = useStore();
  const { username } = store;

  return (
    <TableContainer>
      <Table size="sm" colorScheme="blue">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Author</Th>
            <Th>Song</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {experiencesAndUsers.map(({ user, experience }) => (
            <Tr key={experience.id}>
              <Td>
                <Button
                  ml={-3}
                  size="md"
                  height={8}
                  variant="solid"
                  onClick={() => onLoadExperience(experience)}
                >
                  {experience.name}
                </Button>
              </Td>
              <Td>{user.username}</Td>
              <Td>
                {experience.song?.artist} - {experience.song?.name}
              </Td>
              <Td>
                {user.username === username && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Delete experience"
                    title="Delete experience"
                    icon={<FaTrashAlt size={14} />}
                    disabled={true}
                    onClick={action(() => {
                      if (
                        !confirm(
                          "Are you sure you want to delete this experience? This will permanently cast the experience into the fires of Mount Doom. (jk doesn't work yet)"
                        )
                      )
                        return;

                      // TODO:
                      // trpc.experience.deleteExperience.mutate({
                      //   name: experience.name,
                      //   usingLocalData,
                      // });
                    })}
                  />
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
});
