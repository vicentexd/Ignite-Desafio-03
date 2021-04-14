import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const existsProduct = newCart.find( prod => prod.id === productId);
      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(existsProduct){   
        if(stockAmount < existsProduct.amount + 1){
          toast.error('Quantidade solicitada fora de estoque');
            return ;
        }else {
          existsProduct.amount += 1;
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          return;

        }
      }else{
        const getProduct = await api.get(`products/${productId}`);
        const newProduct = getProduct.data;

        if(stockAmount < 1){
          toast.error('Quantidade solicitada fora de estoque');
          return ;
        }else{
          newProduct.amount = 1;
          newCart.push(newProduct);
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          return;

        }

      }
     
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existsProduct = cart.some(prod => prod.id === productId)
      if(existsProduct){
        const newCart = cart.filter(prod => prod.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
      return;
      }else{
        throw new Error()
      }
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;

      if(stockAmount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      const existsProduct = newCart.find( prod => prod.id === productId);

      if(existsProduct){
        existsProduct.amount = amount;
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return;
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
