import React, { useState, useEffect, useRef } from "react";
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

const CameraButtonTemplate = ({ value, onModalDisplay }) => {
    const ref = useRef(null);
    // const [isMuted, setIsMuted] = useState(false);
    const [word, setword] = useState([]); //카메라 on off

    useEffect(() => {
        console.log("****Camera useEffect");
        console.log(value);

        if (value) {
            setword("camera off");
        } else {
            setword("camera on");
        }
    }, [value]);

    const onChange = e => {
        console.log(word);


        if (value) {
            setword("camera on");
            onModalDisplay(false);
        } else {
            setword("camera off");
            onModalDisplay(true);
        }
        // console.log("****Camera 2");

        // const { value, name } = e.target; 
        // setInputs({
        //   ...inputs,
        //   [name]: value 
        // });
    };


    return (
        <Container>
            <ButtonContainer ref={ref} onClick={onChange} >{word}</ButtonContainer>
        </Container>
    );
};

export default CameraButtonTemplate;