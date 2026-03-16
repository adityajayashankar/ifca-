import { useState } from 'react';

const usePollVotersModal = () => {
  const [pollVotersModalOpen, setPollVotersModalOpen] = useState(false);
  const [pollVotersModalPostId, setPollVotersModalPostId] = useState(null);
  const [pollVotersModalTotalVotes, setPollVotersModalTotalVotes] = useState(0);

  const openPollVotersModal = (postId, totalVotes) => {
    setPollVotersModalPostId(postId);
    setPollVotersModalTotalVotes(totalVotes);
    setPollVotersModalOpen(true);
  };

  const closePollVotersModal = () => {
    setPollVotersModalOpen(false);
    setPollVotersModalPostId(null);
    setPollVotersModalTotalVotes(0);
  };

  return {
    pollVotersModalOpen,
    pollVotersModalPostId,
    pollVotersModalTotalVotes,
    openPollVotersModal,
    closePollVotersModal
  };
};

export default usePollVotersModal;
