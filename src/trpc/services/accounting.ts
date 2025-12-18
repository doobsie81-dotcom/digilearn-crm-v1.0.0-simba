// Helper function to calculate totals
export function calculateTotals(
  items: {
    quantity: string;
    unitPrice: string;
    discount?: string;
    taxRate?: string;
  }[]
) {
  const { subtotal, totalDiscount, totalTax } =
    calculateTotalDiscountAndTax(items);

  const total = subtotal - totalDiscount + totalTax;

  return {
    subtotal: subtotal.toFixed(2),
    tax: totalTax.toFixed(2),
    total: total.toFixed(2),
    discount: totalDiscount.toFixed(2),
  };
}

// Helper function to calculate item total
export function calculateItemTotal(
  quantity: string,
  unitPrice: string,
  discount: string = "0",
  tax: string = "0"
) {
  const subtotal = parseFloat(quantity) * parseFloat(unitPrice);
  const itemDiscount = (subtotal * parseFloat(discount)) / 100;
  const itemTax = ((subtotal - itemDiscount) * parseFloat(tax)) / 100;
  return (subtotal - itemDiscount + itemTax).toFixed(2);
}

export function calculateTotalDiscountAndTax(
  items: {
    quantity: string;
    unitPrice: string;
    discount?: string;
    taxRate?: string;
  }[]
) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    const itemDiscount =
      (itemSubtotal * parseFloat(item.discount || "0")) / 100;
    const itemTax =
      ((itemSubtotal - itemDiscount) * parseFloat(item.taxRate || "0")) / 100;

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
  });

  return { subtotal, totalDiscount, totalTax };
}

export function calculateItemTotalDiscountAndTax(
  quantity: string,
  unitPrice: string,
  discount: string = "0",
  tax: string = "0"
) {
  const subtotal = parseFloat(quantity) * parseFloat(unitPrice);
  const itemDiscount = (subtotal * parseFloat(discount)) / 100;
  const itemTax = ((subtotal - itemDiscount) * parseFloat(tax)) / 100;
  return { itemDiscount, itemTax };
}
