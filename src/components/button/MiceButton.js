import React, { useEffect, useRef } from "react";
import Styled from "styled-components";

const Container = Styled.div`
    position: relative;
    display: inline-block;
    width: 100px;
    height: 40px;
    margin: 5px;
`;
const ButtonContainer = Styled.button`
width: 100px;
height: 40px;
`;

const MiceButtonTemplate = ({ value }) => {
    const ref = useRef(null);
    // const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        console.log("****mice");
        console.log(value);
        // if (ref.current) ref.current.srcObject = stream;
        // if (muted) setIsMuted(muted);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const onChange = e => {
        console.log("****mice");

        // const { value, name } = e.target; 
        // setInputs({
        //   ...inputs,
        //   [name]: value 
        // });
    };

    return (
        <Container>
            <ButtonContainer ref={ref} onClick={onChange} >mice on</ButtonContainer>
        </Container>
    );
};

export default MiceButtonTemplate;