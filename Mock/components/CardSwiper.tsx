import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import GradientCard from "./InfoCard";

interface Card {
  title: string;
  description: string;
  colors: string[];
  category: string;
  image?: any;
}

interface CardSwiperProps {
  cards: Card[];
  onCardPress: (card: Card) => void;
}
const CardSwiper: React.FC<CardSwiperProps> = ({ cards, onCardPress }) => {
  const [cardIndex, setCardIndex] = useState(0);

  const handleSwiped = () => {
    setCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  return (
    <View style={styles.cardContainer}>
      <Swiper
        cards={cards}
        renderCard={(card) => (
          <GradientCard card={card} handleCardPress={() => onCardPress(card)} />
        )}
        onSwiped={handleSwiped}
        verticalSwipe={false}
        cardIndex={cardIndex}
        stackSize={3}
        stackSeparation={1}
        stackScale={4}
        containerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        cardVerticalMargin={0}
        backgroundColor="transparent"
        infinite={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
});

export default CardSwiper;
