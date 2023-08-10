import React, { useEffect, useRef } from "react";
import Styled from "styled-components";

const Container = Styled.div`
    position: relative;
    display: inline-block;
    width: 240px;
    height: 240px;
    margin: 5px;
`;

const VideoContainer = Styled.video`
    width: 240px;
    height: 240px;
    background-color: black;
`;

// interface Props {
//     stream: MediaStream;
//     muted?: boolean;
// }

const VideoTemplate = ({ stream, muted }) => {
    const ref = useRef(null);
    // const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        console.log("****stream");
        console.log(stream);
        if (ref.current) ref.current.srcObject = stream;
        // if (muted) setIsMuted(muted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream, muted]);

    return (
        <Container>
            <VideoContainer ref={ref} autoPlay />
        </Container>
    );
};

export default VideoTemplate;