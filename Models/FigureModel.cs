namespace ModelStore.Models
{
    public class FigureModel
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Brand { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsOnSale { get; set; }
        public string? ImageUrl { get; set; }
        public string? Series { get; set; }
    }
}
